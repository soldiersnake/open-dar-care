import Link from "next/link";

export default function ActivateAccount() {
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
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>

        <h1 className="m-0 mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="m-0 mb-6.5 text-[15.5px] leading-[1.55] text-muted-soft">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <div className="mb-5.5 flex items-center gap-3.5 rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-avatar-kids font-display text-[19px] font-semibold text-avatar-kids-ink">
            M
          </div>
          <div>
            <div className="text-[13px] text-muted-soft">
              Te invitaron a seguir a
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              Mateo · Sala Soles
            </div>
          </div>
        </div>

        <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
          CÓDIGO DE INVITACIÓN
        </div>
        <input
          type="text"
          defaultValue="7K4P9"
          className="mb-4.5 block w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-ink focus:outline-none"
        />

        <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
          EMAIL
        </div>
        <input
          type="email"
          defaultValue="lucia.fernandez@gmail.com"
          className="mb-4.5 block w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink focus:outline-none"
        />

        <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
          CREAR CONTRASEÑA
        </div>
        <input
          type="password"
          defaultValue="contraseña"
          className="mb-4.5 block w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-3.5 text-[15px] text-ink focus:outline-none"
        />

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
          <span className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-[8px] bg-[#5FB97E]">
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
          <span className="text-[14px] leading-[1.45] text-[#8A7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo
            dentro de la app.
          </span>
        </label>

        <a
          href="#"
          className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-3.75 text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Activar mi cuenta
        </a>

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
