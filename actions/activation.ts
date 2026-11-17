"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type ActivationState = { error: string };

const MIN_PASSWORD_LENGTH = 6;

// Same minimal email shape the other forms validate.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_ERROR = "La contraseña debe tener al menos 6 caracteres.";
const CONSENT_ERROR = "Debés autorizar para continuar.";

// Server Action behind /activar-cuenta (SPEC 15). The parent arrives from the
// invitation email with the code and email prefilled; the invitation row is
// the source of truth for the child, the relationship and the parent's name.
//
// Flow A (new email): signUp creates the Auth user (email confirmation is
// disabled by project decision, so it returns a session) — the session is
// signed out immediately so the SPEC 10 proxy doesn't bounce /login → /, then
// redirect to /login?activada=1.
//
// Flow B (email already registered — a parent linking a 2nd child): no second
// account, no password needed; owning the code sent to that email proves
// ownership, so only the parent_children link is created.
export async function activateAccount(
  _state: ActivationState,
  formData: FormData,
): Promise<ActivationState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const consented = formData.get("consent") !== null;

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: PASSWORD_ERROR };
  }

  if (!consented) {
    return { error: CONSENT_ERROR };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Ingresa un email válido." };
  }

  // The admin client bypasses RLS: invitations/parent_children and the Auth
  // admin API are server-side only here (the parent has no session at all).
  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("invitations")
    .select(
      "id, email, full_name, relationship, status, expires_at, children ( id, rooms ( daycare_id, name ) )",
    )
    .eq("code", code)
    .maybeSingle<{
      id: string;
      email: string;
      full_name: string;
      relationship: "father" | "mother" | "guardian";
      status: "pending" | "accepted" | "expired" | "cancelled";
      expires_at: string;
      children: {
        id: string;
        rooms: { daycare_id: string; name: string } | { daycare_id: string; name: string }[] | null;
      } | null;
    }>();

  // Unknown, cancelled (re-invited) or already-used codes read the same to a
  // stranger: "inválido" (no information leak).
  if (!invitation || invitation.status !== "pending") {
    return { error: "Código de invitación inválido." };
  }

  if (new Date(invitation.expires_at).getTime() <= Date.now()) {
    return { error: "La invitación expiró. Pedile a la guardería una nueva." };
  }

  if (invitation.email !== email) {
    return { error: "El email no coincide con la invitación." };
  }

  const childRelation = invitation.children;
  const childRoom = Array.isArray(childRelation?.rooms)
    ? childRelation.rooms[0]
    : childRelation?.rooms;
  const daycareId = childRoom?.daycare_id ?? null;

  if (!childRelation || !daycareId) {
    return { error: "No se pudo activar la cuenta. Reintentá." };
  }

  // Does the email already have an Auth account? (Admin lookup by email
  // instead of relying on signUp's obfuscated behavior — spec risk note.)
  const existingUserId = await findAuthUserIdByEmail(admin, email);

  if (existingUserId) {
    // Flow B: create only the link and accept the invitation.
    const linkError = await createLinkAndAccept(admin, {
      parentId: existingUserId,
      childId: childRelation.id,
      relationship: invitation.relationship,
      invitationId: invitation.id,
    });
    if (linkError) return { error: linkError };

    redirect("/login?activada=1&existente=1");
  }

  // Flow A: create the account with the parent metadata the SPEC 09 trigger
  // needs (daycare_id, role, full_name) — it builds the public.users profile.
  const supabase = createClient(await cookies());
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        daycare_id: daycareId,
        role: "parent",
        full_name: invitation.full_name,
      },
    },
  });

  if (signUpError || !signUpData?.user) {
    // Email existing but not found in the lookup (or any other Auth error):
    // generic retry message, no information leak.
    console.error("activation signup failed:", signUpError?.message);
    return { error: "No se pudo activar la cuenta. Reintentá." };
  }

  if (!signUpData.session) {
    // Precondition drift: "Confirm email" is still enabled in the Supabase
    // dashboard (spec precondición). The account is created but unconfirmed,
    // so its first login will fail until the setting is turned off (or the
    // email gets confirmed manually).
    console.error(
      "activation: signUp returned no session — 'Confirm email' is still enabled in the Supabase dashboard (precondición de la SPEC 15).",
    );
  }

  // Email confirmation is disabled, so signUp returns a session. Sign out
  // right away: the SPEC 10 proxy would redirect /login → / with a session,
  // and the parent must land on a clean login screen.
  await supabase.auth.signOut();

  const linkError = await createLinkAndAccept(admin, {
    parentId: signUpData.user.id,
    childId: childRelation.id,
    relationship: invitation.relationship,
    invitationId: invitation.id,
  });
  if (linkError) return { error: linkError };

  redirect("/login?activada=1");
}

type LinkArgs = {
  parentId: string;
  childId: string;
  relationship: "father" | "mother" | "guardian";
  invitationId: string;
};

// Creates the parent_children link (idempotent against the UNIQUE pair) and
// marks the invitation accepted.
async function createLinkAndAccept(
  admin: ReturnType<typeof createAdminClient>,
  args: LinkArgs,
): Promise<string | null> {
  const { error: linkError } = await admin.from("parent_children").upsert(
    {
      parent_id: args.parentId,
      child_id: args.childId,
      relationship: args.relationship,
    },
    { onConflict: "parent_id,child_id" },
  );

  if (linkError) {
    console.error("activation link failed:", linkError.message);
    return "No se pudo activar la cuenta. Reintentá.";
  }

  const { error: acceptError } = await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", args.invitationId);

  if (acceptError) {
    console.error("activation accept failed:", acceptError.message);
    return "No se pudo activar la cuenta. Reintentá.";
  }

  return null;
}

// Small-project lookup: paginate the admin user list and match by email
// (case-insensitive). Switch to a targeted RPC if the user table grows.
async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string | null> {
  const page = async (pageNumber: number): Promise<string | null> => {
    const { data, error } = await admin.auth.admin.listUsers({
      page: pageNumber,
      perPage: 200,
    });

    if (error) {
      console.error("activation user lookup failed:", error.message);
      return null;
    }

    const match = data.users.find(
      (user) => (user.email ?? "").toLowerCase() === email,
    );
    if (match) return match.id;
    if (data.users.length < 200) return null;
    return page(pageNumber + 1);
  };

  return page(1);
}
