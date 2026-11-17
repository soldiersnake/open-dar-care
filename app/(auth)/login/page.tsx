import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

// SPEC 15: after activating an account (new signup or a 2nd-child link), the
// parent lands here with ?activada=1 and sees an inline success banner above
// the form. Without the param, /login renders exactly as SPEC 10.
const SUCCESS_MESSAGE = "Tu cuenta quedó lista. Iniciá sesión con tu email y contraseña.";
const EXISTING_ACCOUNT_MESSAGE =
  "Ya tenías cuenta: iniciá sesión para ver a tu familia.";

export default function Login({
  searchParams,
}: {
  searchParams: Promise<{ activada?: string; existente?: string }>;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="pointer-events-none relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-15 py-14 text-white md:flex">
        <div className="absolute -top-35 -right-30 h-105 w-105 rounded-full bg-white/12" />
        <div className="absolute -bottom-27.5 -left-20 h-75 w-75 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3.25">
          <div className="flex h-11.5 w-11.5 flex-none items-center justify-center rounded-[14px] bg-white/22">
            <svg
              width="26"
              height="26"
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
          <span className="font-display text-[21px] font-semibold tracking-[0.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="m-0 mb-4.5 font-display text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="m-0 max-w-107.5 text-[17px] leading-[1.6] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias
            cerca, desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-white/90">
          🌿 Guardería Sala Soles
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center gap-5 p-10">
        {/* Request-time section (cacheComponents): searchParams + the form
            stream inside the Suspense boundary. */}
        <Suspense fallback={<div className="w-full max-w-98 animate-pulse" />}>
          <LoginSuccessSection searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

// Reads ?activada=1&existente=1 at request time and renders the success
// banner (when present) above the form.
async function LoginSuccessSection({
  searchParams,
}: {
  searchParams: Promise<{ activada?: string; existente?: string }>;
}) {
  const { activada, existente } = await searchParams;
  const successMessage =
    activada === "1"
      ? existente === "1"
        ? EXISTING_ACCOUNT_MESSAGE
        : SUCCESS_MESSAGE
      : null;

  return (
    <>
      {successMessage ? (
        <div
          role="status"
          className="flex w-full max-w-98 items-center gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5"
        >
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#5FB97E]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-[13.5px] leading-[1.45] font-bold text-[#8A7234]">
            {successMessage}
          </span>
        </div>
      ) : null}
      {/* Real login is wired to Supabase Auth; dev ships the seed email pre-filled. */}
      <LoginForm
        prefillEmail={
          process.env.NODE_ENV === "development" ? "staff@opendaycare.test" : ""
        }
      />
    </>
  );
}
