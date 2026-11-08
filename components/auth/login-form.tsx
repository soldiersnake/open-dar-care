"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";

type LoginFormProps = {
  // Dev seeds it with a real test user; other environments ship it empty.
  prefillEmail: string;
};

export function LoginForm({ prefillEmail }: LoginFormProps) {
  const [state, action, pending] = useActionState(signIn, { error: "" });

  return (
    <form action={action} className="w-full max-w-98">
      <h2 className="m-0 mb-1.5 font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h2>
      <p className="m-0 mb-7 text-[15px] text-muted-soft">
        Ingresá para ver el día de hoy.
      </p>

      <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        defaultValue={prefillEmail}
        placeholder="tu@ejemplo.com"
        className="mb-4.5 block w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink focus:outline-none"
      />

      <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
        CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        placeholder="••••••••"
        className="mb-2.5 block w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink focus:outline-none"
      />

      {state.error ? (
        <p
          role="alert"
          className="m-0 mb-2.5 text-[13px] font-bold text-[#C5503A]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="mb-5 text-right">
        <a href="#" className="text-[13.5px] font-bold text-accent-edit">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-3.75 text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-80"
      >
        Iniciar sesión
      </button>

      <p className="m-0 mt-6 text-center text-[14.5px] text-muted-soft">
        ¿Te invitó la guardería?{" "}
        <Link href="/activar-cuenta" className="font-extrabold text-accent-edit">
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
