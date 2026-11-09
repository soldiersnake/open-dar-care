"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createChild } from "@/actions/children";
import { useToast } from "@/components/shared/toast-provider";
import type { KidDraft, RoomOption } from "@/lib/kids-data";

const fieldClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] outline-none placeholder:text-[#B6A99B]";

const REQUIRED_MESSAGE = "Este campo es obligatorio";

type RequiredFieldName = "name" | "birthDate" | "room";
type FieldErrors = Partial<Record<RequiredFieldName, string>>;

// Allergy tags persist in English (SPEC 11 contract): the modal translates
// known Spanish labels before calling the action; unknown tags pass through
// as lowercase text (display layer translates them back for the badge).
const SPANISH_TO_ENGLISH_TAGS: Record<string, string> = {
  "maní": "peanut",
  mani: "peanut",
  lactosa: "lactose",
  lacteos: "dairy",
  "lácteos": "dairy",
  gluten: "gluten",
  huevo: "egg",
  soja: "soy",
  pescado: "fish",
  "frutos secos": "nuts",
  polen: "pollen",
  penicilina: "penicillin",
};

function toEnglishTags(input: string): string {
  const translations = input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .map((tag) => SPANISH_TO_ENGLISH_TAGS[tag] ?? tag);
  return [...new Set(translations)].join(", ");
}

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
  rooms,
  mockMode = false,
  onSave,
  onClose,
}: {
  rooms: RoomOption[];
  mockMode?: boolean;
  onSave?: (draft: KidDraft) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [draft, setDraft] = useState({
    name: "",
    birthDate: "",
    room: "",
    allergies: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

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

  const updateDraft = (field: keyof typeof draft) =>
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Inline validation first: the action only runs once all required
    // fields are present (SPEC 12).
    const validation: FieldErrors = {
      name: draft.name.trim() === "" ? REQUIRED_MESSAGE : undefined,
      birthDate: draft.birthDate === "" ? REQUIRED_MESSAGE : undefined,
      room: draft.room === "" ? REQUIRED_MESSAGE : undefined,
    };
    if (validation.name ?? validation.birthDate ?? validation.room) {
      setErrors(validation);
      return;
    }

    // Mock environment (SPEC 14): SPEC 05 save — client-side only, no DB.
    // Same success toast as the real POST for consistent feedback.
    if (mockMode) {
      onSave?.(draft);
      showToast(`El niño/a ${draft.name.trim()} agregado a la sala ${draft.room}`, "success");
      onClose();
      return;
    }

    const roomId = rooms.find((room) => room.name === draft.room)?.id ?? "";

    const formData = new FormData();
    formData.set("full_name", draft.name);
    formData.set("birth_date", draft.birthDate);
    formData.set("room_id", roomId);
    formData.set("allergy_tags", toEnglishTags(draft.allergies));
    formData.set("medical_notes", draft.notes);

    setSaving(true);
    try {
      const result = await createChild(null, formData);

      if (result.ok) {
        showToast(`El niño/a ${draft.name.trim()} agregado a la sala ${draft.room}`, "success");
        onClose();
        // The server page re-reads the DB and the list shows the new kid.
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] p-4 md:p-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
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
              disabled={saving}
              className="cursor-pointer text-[15px] font-extrabold text-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                  {rooms.map((room) => (
                    // Mock fallback rooms (connection lost) share no uuid, so the
                    // key combines id and name to stay unique (SPEC 12)
                    <option key={`${room.id}:${room.name}`} value={room.name}>
                      {room.name}
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
