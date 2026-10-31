"use client";

import { useEffect, useState } from "react";
import { ROOMS, type KidDraft } from "@/lib/kids-data";

const fieldClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] outline-none placeholder:text-[#B6A99B]";

const REQUIRED_MESSAGE = "Este campo es obligatorio";

type RequiredFieldName = "name" | "birthDate" | "room";
type FieldErrors = Partial<Record<RequiredFieldName, string>>;

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-muted-soft"
    >
      {children}
    </label>
  );
}

function FieldError({ id }: { id: string }) {
  return (
    <p id={id} className="mt-1.5 text-[12px] font-bold text-accent-edit">
      {REQUIRED_MESSAGE}
    </p>
  );
}

function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AddKidModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: KidDraft) => void;
}) {
  const [draft, setDraft] = useState<KidDraft>({
    name: "",
    birthDate: "",
    room: "",
    allergies: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

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

  const updateDraft = (field: keyof KidDraft) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setDraft((current) => ({ ...current, [field]: event.target.value }));
      // Inline errors clear as soon as their field gets a new value
      if (field === "name" || field === "birthDate" || field === "room") {
        setErrors((current) =>
          current[field as RequiredFieldName] === undefined
            ? current
            : { ...current, [field]: undefined },
        );
      }
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation: FieldErrors = {
      name: draft.name.trim() === "" ? REQUIRED_MESSAGE : undefined,
      birthDate: draft.birthDate === "" ? REQUIRED_MESSAGE : undefined,
      room: draft.room === "" ? REQUIRED_MESSAGE : undefined,
    };
    if (validation.name ?? validation.birthDate ?? validation.room) {
      setErrors(validation);
      return;
    }
    onSave(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] p-4 md:p-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-kid-title"
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex items-center justify-between border-b border-line px-4 py-5 md:px-[26px]">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[15px] font-bold text-muted-soft"
            >
              Cancelar
            </button>
            <span
              id="add-kid-title"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Agregar niño
            </span>
            <button
              type="submit"
              className="cursor-pointer text-[15px] font-extrabold text-accent"
            >
              Guardar
            </button>
          </div>

          <div className="px-4 py-6 md:px-[26px]">
            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-name">NOMBRE COMPLETO</FieldLabel>
              <input
                id="kid-name"
                type="text"
                autoFocus
                value={draft.name}
                onChange={updateDraft("name")}
                placeholder="Ej. Martina López"
                aria-invalid={errors.name !== undefined}
                aria-describedby={errors.name !== undefined ? "kid-name-error" : undefined}
                className={`${fieldClass} text-ink`}
              />
              {errors.name !== undefined && <FieldError id="kid-name-error" />}
            </div>

            <div className="mb-[18px] flex flex-col gap-3.5 md:flex-row">
              <div className="min-w-0 flex-1">
                <FieldLabel htmlFor="kid-birth-date">FECHA DE NACIMIENTO</FieldLabel>
                <input
                  id="kid-birth-date"
                  type="date"
                  value={draft.birthDate}
                  onChange={updateDraft("birthDate")}
                  aria-invalid={errors.birthDate !== undefined}
                  aria-describedby={
                    errors.birthDate !== undefined ? "kid-birth-date-error" : undefined
                  }
                  className={`${fieldClass} text-ink`}
                />
                {errors.birthDate !== undefined && (
                  <FieldError id="kid-birth-date-error" />
                )}
              </div>
              <div className="relative min-w-0 flex-1">
                <FieldLabel htmlFor="kid-room">SALA</FieldLabel>
                <select
                  id="kid-room"
                  value={draft.room}
                  onChange={updateDraft("room")}
                  aria-invalid={errors.room !== undefined}
                  aria-describedby={errors.room !== undefined ? "kid-room-error" : undefined}
                  className={`${fieldClass} cursor-pointer appearance-none pr-10 font-bold ${
                    draft.room === "" ? "text-[#B6A99B]" : "text-ink"
                  }`}
                >
                  <option value="" disabled hidden>
                    Seleccionar sala
                  </option>
                  {ROOMS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                <Chevron />
                {errors.room !== undefined && <FieldError id="kid-room-error" />}
              </div>
            </div>

            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-allergies">ALERGIAS (ETIQUETAS)</FieldLabel>
              <input
                id="kid-allergies"
                type="text"
                value={draft.allergies}
                onChange={updateDraft("allergies")}
                placeholder="Ej. Maní, Lactosa"
                className={`${fieldClass} text-ink`}
              />
            </div>

            <div>
              <FieldLabel htmlFor="kid-notes">NOTAS MÉDICAS</FieldLabel>
              <textarea
                id="kid-notes"
                value={draft.notes}
                onChange={updateDraft("notes")}
                placeholder="Indicaciones, medicación, contactos…"
                className={`${fieldClass} min-h-[90px] resize-y text-ink leading-[1.5]`}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
