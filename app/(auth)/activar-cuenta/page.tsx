import { Suspense } from "react";
import Link from "next/link";
import { ActivationForm } from "@/components/auth/activation-form";
import { createAdminClient } from "@/utils/supabase/admin";

type InvitationCardData = {
  childName: string;
  roomName: string;
};

// Resolves the invitation card (child + room) from the code prefilled in the
// URL. SPEC 04 shipped it as mock text ("Mateo · Sala Soles"); SPEC 15 makes
// the whole screen real, so the card reads the actual invitation. No code in
// the URL (direct visit) → a neutral placeholder instead of mock data.
async function resolveInvitationCard(code: string): Promise<InvitationCardData | null> {
  if (code.length === 0) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("children ( full_name, rooms ( name ) )")
    .eq("code", code)
    .maybeSingle<{
      children: {
        full_name: string;
        rooms: { name: string } | { name: string }[] | null;
      } | null;
    }>();

  const child = data?.children;
  if (!child) return null;

  const room = Array.isArray(child.rooms) ? child.rooms[0] : child.rooms;

  return { childName: child.full_name, roomName: room?.name ?? "" };
}

export default function ActivateAccount({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; email?: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-10">
      <div className="w-full max-w-110">
        <div className="mb-5.5 flex h-14.5 w-14.5 items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4 1.4" />
          </svg>
        </div>

        <h1 className="m-0 mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="m-0 mb-6.5 text-[15.5px] leading-[1.55] text-muted-soft">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        {/* Request-time section (cacheComponents): searchParams + invitation
            card lookup live inside the Suspense boundary. */}
        <Suspense fallback={<ActivationLoading />}>
          <ActivateAccountSection searchParams={searchParams} />
        </Suspense>

        <p className="m-0 mt-5.5 text-center text-[14.5px] text-muted-soft">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-accent-edit">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

// Placeholder while the card + prefilled form resolve (streamed after the
// static shell).
function ActivationLoading() {
  return (
    <div className="w-full animate-pulse">
      <div className="mb-5.5 h-18 rounded-2xl bg-white/60" />
      <div className="mb-4.5 h-13.5 rounded-[14px] bg-white/60" />
      <div className="mb-4.5 h-13.5 rounded-[14px] bg-white/60" />
      <div className="mb-6 h-13.5 rounded-[14px] bg-white/60" />
    </div>
  );
}

async function ActivateAccountSection({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; email?: string }>;
}) {
  const { code = "", email = "" } = await searchParams;
  const card = await resolveInvitationCard(code);
  const initials = card ? card.childName.trim().charAt(0).toUpperCase() : "•";

  return (
    <>
      <div className="mb-5.5 flex items-center gap-3.5 rounded-2xl border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-avatar-kids font-display text-[19px] font-semibold text-avatar-kids-ink">
          {initials}
        </div>
        <div>
          <div className="text-[13px] text-muted-soft">
            Te invitaron a seguir a
          </div>
          <div className="font-display text-[17px] font-semibold text-ink">
            {card ? `${card.childName} · Sala ${card.roomName}` : "—"}
          </div>
        </div>
      </div>

      <ActivationForm prefillCode={code} prefillEmail={email} />
    </>
  );
}
