"use client";

import { useActionState } from "react";
import { activateAccount, type ActivationState } from "@/actions/activation";

type ActivationFormProps = {
  // Prefilled from the invitation email link (?code=…&email=…); empty when
  // the page is opened directly.
  prefillCode: string;
  prefillEmail: string;
};

const initialError: ActivationState = { error: "" };

// Client form of /activar-cuenta (SPEC 15): same visual as the SPEC 04
// mockup, now wired to the activateAccount Server Action. The code and email
// arrive prefilled from the email link; the password is always typed by hand.
export function ActivationForm({ prefillCode, prefillEmail }: ActivationFormProps) {
  const [state, action, pending] = useActionState(activateAccount, initialError);

  return (
    <form action={action} className="w-full" noValidate>
      <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        type="text"
        name="code"
        defaultValue={prefillCode}
        placeholder="XXXXX"
        autoComplete="off"
        className="mb-4.5 block w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-ink uppercase focus:outline-none"
      />

      <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        defaultValue={prefillEmail}
        placeholder="correo@ejemplo.com"
        className="mb-4.5 block w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink focus:outline-none"
      />

      <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-muted-soft">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        placeholder="••••••••"
        className="mb-4.5 block w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-ink focus:outline-none"
      />

      {/* Real consent checkbox: same look as the mock when checked, grey
          before. Validated (required) but not persisted — spec decision. */}
      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
        <input type="checkbox" name="consent" className="peer sr-only" />
        <span className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#EADFD0] peer-checked:bg-[#5FB97E]">
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

      {state.error ? (
        <p role="alert" className="m-0 mb-2.5 text-[13px] font-bold text-[#C5503A]">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-3.75 text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-80"
      >
        Activar mi cuenta
      </button>
    </form>
  );
}
