import { LoginForm } from "@/components/auth/login-form";

export default function Login() {
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
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
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
      <div className="flex items-center justify-center p-10">
        {/* Real login is wired to Supabase Auth; dev ships the seed email pre-filled. */}
        <LoginForm
          prefillEmail={
            process.env.NODE_ENV === "development" ? "staff@opendaycare.test" : ""
          }
        />
      </div>
    </div>
  );
}
