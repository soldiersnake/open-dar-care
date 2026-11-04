"use client";

import { useEffect, useState } from "react";
import { INVITATION_RELATIONS } from "@/lib/kids-data";

const fieldClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] outline-none placeholder:text-[#B6A99B]";

function FieldLabel({ htmlFor, className, children }: { htmlFor: string; className?: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] ${className ?? ""}`}
    >
      {children}
    </label>
  );
}

function ChipLabel({ className, children }: { className?: string; children: string }) {
  return (
    <div className={`block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] ${className ?? ""}`}>
      {children}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="mt-px flex-none"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4E72C8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

const chipsetClasses = (active: boolean) =>
  `flex-1 cursor-pointer rounded-full border-[1.5px] py-[11px] text-[14px] font-extrabold ${
    active
      ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
      : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
  }`;

type Relation = (typeof INVITATION_RELATIONS)[number];

export function LinkParentModal({
  kidName,
  invitationCode,
  onClose,
}: {
  kidName: string;
  invitationCode: string;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<{ name: string; email: string; relation: Relation }>({
    name: "",
    email: "",
    relation: INVITATION_RELATIONS[0],
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const updateDraft = (field: "name" | "email" | "relation") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDraft((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Validation and save are wired in step 4.
  };

  return (
    <div
      className="z-50 fixed inset-0 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] p-4 md:p-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-parent-title"
        className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex items-center justify-between gap-3 border-b border-[#ECE0D0] py-5 pr-[26px] pl-[26px]">
            <div className="min-w-0">
              <span id="link-parent-title" className="block font-display text-[18px] font-semibold text-ink">
                Vincular padre
              </span>
              <p className="m-0 text-[13px] text-[#A89A8B]">a {kidName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="px-[26px] py-[22px]">
            <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
              <InfoIcon />
              <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
                Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {kidName.split(" ")[0]}.
              </span>
            </div>

            <div className="mb-[18px]">
              <FieldLabel htmlFor="link-parent-name" className="mb-2">NOMBRE DEL PADRE/MADRE</FieldLabel>
              <input
                id="link-parent-name"
                type="text"
                autoFocus
                value={draft.name}
                onChange={updateDraft("name")}
                placeholder="Ej. Diego Fernández"
                className={`${fieldClass} text-ink`}
              />
            </div>

            <div className="mb-[18px]">
              <FieldLabel htmlFor="link-parent-email" className="mb-2">EMAIL</FieldLabel>
              <input
                id="link-parent-email"
                type="email"
                value={draft.email}
                onChange={updateDraft("email")}
                placeholder="correo@ejemplo.com"
                className={`${fieldClass} text-ink`}
              />
            </div>

            <div className="mb-5">
              <ChipLabel className="mb-2.5">PARENTESCO</ChipLabel>
              <fieldset className="m-0 flex gap-[9px] border-0 p-0">
                <legend className="sr-only">Parentesco</legend>
                {INVITATION_RELATIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, relation: option }))}
                    className={chipsetClasses(draft.relation === option)}
                  >
                    {option}
                  </button>
                ))}
              </fieldset>
            </div>

            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
                {invitationCode}
              </div>
              <div className="mt-1.5 text-[13px] text-[#A88526]">Vence en 7 días</div>
            </div>

            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
            >
              <SendIcon />
              Enviar invitación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
