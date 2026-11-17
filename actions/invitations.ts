"use server";

import { cookies, headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendInvitationEmail } from "@/lib/email";
import {
  INVITATION_CODE_ALPHABET,
  INVITATION_CODE_LENGTH,
  RELATIONSHIP_BY_CHIP,
  generateInvitationCode,
} from "@/lib/kids-data";

export type CreateInvitationInput = {
  childId: string;
  fullName: string;
  email: string;
  relation: string;
  code: string;
};

export type CreateInvitationResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

const INVITATION_TTL_DAYS = 7;

const CODE_PATTERN = new RegExp(
  `^[${INVITATION_CODE_ALPHABET}]{${INVITATION_CODE_LENGTH}}$`,
);

// Same minimal email shape the modal validates client-side.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Absolute origin of the current request, to build the activation link of the
// email. Derived from headers(): no extra env var (spec decision).
const requestOrigin = async (): Promise<string> => {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const forwardedProto = headerList.get("x-forwarded-proto");
  const proto =
    forwardedProto ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
};

// Server Action invoked by the link-parent modal in real mode (dev:mock keeps
// its client-side path, SPEC 06/14). Creates the invitations row and sends the
// email: invitation first, email after (spec decision) — if the email fails,
// the row stays `pending` and re-inviting cancels it and regenerates.
export async function createInvitation(
  input: CreateInvitationInput,
): Promise<CreateInvitationResult> {
  // Session check: a Server Action is an invocable endpoint. getClaims()
  // verifies the JWT signature on every call (never trust the cookie alone).
  const supabase = createClient(await cookies());
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    return { ok: false, error: "Sin sesión activa." };
  }

  const fullName = input.fullName.trim();
  // Stored lowercase: the duplicate checks compare against the normalized
  // value, so "Lucia@X.com" and "lucia@x.com" are the same invitation.
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim().toUpperCase();
  const relationship = RELATIONSHIP_BY_CHIP[input.relation as keyof typeof RELATIONSHIP_BY_CHIP];

  if (fullName.length === 0) {
    return { ok: false, error: "El nombre del padre/madre es obligatorio." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Ingresa un email válido." };
  }

  if (!(input.relation in RELATIONSHIP_BY_CHIP)) {
    return { ok: false, error: "Selecciona un parentesco válido." };
  }

  if (!CODE_PATTERN.test(code)) {
    return { ok: false, error: "El código de invitación es inválido." };
  }

  if (!UUID_PATTERN.test(input.childId)) {
    return { ok: false, error: "El niño no es válido." };
  }

  // The admin client bypasses RLS: invitations/parent_children/users/children
  // have no select policies yet, so reading them with the session client
  // would fail (same pattern as actions/children.ts, SPEC 12).
  const admin = createAdminClient();

  // The child must exist and belong to the staff's daycare (same ownership
  // guard as createChild).
  const { data: child } = await admin
    .from("children")
    .select("id, full_name, rooms(daycare_id)")
    .eq("id", input.childId)
    .maybeSingle<{ id: string; full_name: string; rooms: { daycare_id: string } | { daycare_id: string }[] | null }>();

  if (!child) {
    return { ok: false, error: "El niño no existe." };
  }

  const childRoom = Array.isArray(child.rooms) ? child.rooms[0] : child.rooms;
  const { data: staffProfile } = await admin
    .from("users")
    .select("daycare_id")
    .eq("id", userId)
    .maybeSingle<{ daycare_id: string }>();

  if (!staffProfile?.daycare_id || childRoom?.daycare_id !== staffProfile.daycare_id) {
    return { ok: false, error: "El niño no pertenece a tu guardería." };
  }

  // Already linked to THIS child ⟺ an accepted invitation exists for the same
  // email+child (links only ever originate from an accepted invitation). An
  // email linked to OTHER children is fine: a parent can have N children.
  const { data: accepted } = await admin
    .from("invitations")
    .select("id")
    .eq("child_id", input.childId)
    .eq("email", email)
    .eq("status", "accepted")
    .maybeSingle<{ id: string }>();

  if (accepted) {
    return {
      ok: false,
      error: `Este email ya está vinculado a ${child.full_name}.`,
    };
  }

  // Re-inviting: a live (pending, not expired) invitation for the same
  // email+child gets cancelled and a fresh one is created (new code + new
  // 7-day window) — the staff never sees a duplicate error.
  await admin
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("child_id", input.childId)
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // The client proposes the code shown in the yellow box; the server keeps it
  // as-is unless it collides with the UNIQUE code (regenerate + retry, max 5
  // attempts — nearly impossible in a 31^5 space).
  let finalCode = code;
  let insertedId: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from("invitations")
      .insert({
        child_id: input.childId,
        invited_by: userId,
        full_name: fullName,
        email,
        relationship,
        code: finalCode,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, code")
      .single<{ id: string; code: string }>();

    if (!error && data) {
      insertedId = data.id;
      finalCode = data.code;
      break;
    }

    const isCodeCollision =
      error?.code === "23505" && (error?.message ?? "").includes("invitations_code_key");
    if (!isCodeCollision) {
      return { ok: false, error: "No se pudo crear la invitación." };
    }
    finalCode = generateInvitationCode();
  }

  if (!insertedId) {
    return { ok: false, error: "No se pudo crear la invitación." };
  }

  const origin = await requestOrigin();
  const activationUrl = `${origin}/activar-cuenta?code=${encodeURIComponent(finalCode)}&email=${encodeURIComponent(email)}`;

  const emailResult = await sendInvitationEmail({
    to: email,
    fullName,
    childName: child.full_name,
    code: finalCode,
    activationUrl,
  });

  if (!emailResult.ok) {
    // The invitation row stays `pending`: re-inviting cancels it and
    // regenerates. The modal stays open with an inline retry message; the
    // server log keeps the underlying Resend reason for debugging.
    console.error("invitation email failed:", emailResult.reason);
    return { ok: false, error: "No se pudo enviar el correo. Reintentá." };
  }

  return { ok: true, code: finalCode };
}
