"use client";

import { useEffect, useRef, useState } from "react";
import {
  POST_TYPES,
  type PostDraft,
  type PostType,
} from "@/lib/feed-data";
import { kids } from "@/lib/kids-data";

const fieldClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] outline-none placeholder:text-[#B6A99B]";

const PAR_ERROR = "Elegí al menos un niño";
const TYPE_ERROR = "Elegí al menos un tipo";
const REQUIRED_MESSAGE = "Este campo es obligatorio";

type SectionErrors = Partial<Record<"para" | "type" | "text", string>>;

// Exact chip palette of the mockup (TIPO); inactive chips use the neutral pill
const TYPE_STYLES: Record<PostType, { bg: string; text: string }> = {
  Comida: { bg: "#9A7B1E", text: "#fff" },
  Siesta: { bg: "#E7DCF6", text: "#7B5FC0" },
  Actividad: { bg: "#2E89A6", text: "#fff" },
  Logro: { bg: "#CFEBD8", text: "#3E9B6C" },
  Ánimo: { bg: "#F9D2DE", text: "#C56486" },
  Foto: { bg: "#FBD8CC", text: "#D9684A" },
  Anuncio: { bg: "#CCD8F4", text: "#4E72C8" },
};

// Same tokens as components/shared/avatar.tsx, sized for the 26px chip avatar
const KID_AVATAR_CLASSES: Record<string, string> = {
  sky: "bg-avatar-kids text-avatar-kids-ink",
  pink: "bg-avatar-pink text-avatar-pink-ink",
  green: "bg-avatar-green text-avatar-green-ink",
  yellow: "bg-avatar-yellow text-avatar-yellow-ink",
  purple: "bg-avatar-purple text-avatar-purple-ink",
};

function SectionLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2.5 block text-[12px] font-extrabold tracking-[0.7px] text-muted-soft"
    >
      {children}
    </label>
  );
}

function SectionError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 text-[12px] font-bold text-accent-edit">
      {message}
    </p>
  );
}

type LocalPhoto = { url: string; name: string };

export function CreatePostModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: PostDraft) => void;
}) {
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<PostType[]>([]);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [errors, setErrors] = useState<SectionErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allKidsSelected = selectedKids.length === kids.length;

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
      // Local previews are object URLs; nothing was uploaded, so revoke them
      setPhotos((current) => {
        current.forEach((photo) => URL.revokeObjectURL(photo.url));
        return [];
      });
    };
  }, [onClose]);

  const toggleKid = (kidName: string) => {
    setSelectedKids((current) =>
      current.includes(kidName)
        ? current.filter((name) => name !== kidName)
        : [...current, kidName],
    );
    setErrors((current) =>
      current.para === undefined ? current : { ...current, para: undefined },
    );
  };

  // "Toda la sala" selects everyone when someone is missing, clears all otherwise
  const toggleWholeRoom = () => {
    setSelectedKids(allKidsSelected ? [] : kids.map((kid) => kid.name));
    setErrors((current) =>
      current.para === undefined ? current : { ...current, para: undefined },
    );
  };

  const toggleType = (type: PostType) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
    setErrors((current) =>
      current.type === undefined ? current : { ...current, type: undefined },
    );
  };

  const updateText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    setErrors((current) =>
      current.text === undefined ? current : { ...current, text: undefined },
    );
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setPhotos((current) => [
      ...current,
      ...files.map((file) => ({ url: URL.createObjectURL(file), name: file.name })),
    ]);
    event.target.value = ""; // allow re-adding the same file
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation: SectionErrors = {
      para: selectedKids.length === 0 ? PAR_ERROR : undefined,
      type: selectedTypes.length === 0 ? TYPE_ERROR : undefined,
      text: text.trim() === "" ? REQUIRED_MESSAGE : undefined,
    };
    if (validation.para ?? validation.type ?? validation.text) {
      setErrors(validation);
      return;
    }
    onSave({
      kidNames: selectedKids,
      wholeRoom: allKidsSelected,
      types: selectedTypes,
      text,
      photoCount: photos.length,
    });
    onClose();
  };

  const neutralChip =
    "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]";

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
        aria-labelledby="new-post-title"
        className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-line bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
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
              id="new-post-title"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Nueva publicación
            </span>
            <button
              type="submit"
              className="cursor-pointer text-[15px] font-extrabold text-accent"
            >
              Publicar
            </button>
          </div>

          <div className="px-4 py-6 md:px-[26px]">
            {/* PARA */}
            <div>
              <SectionLabel htmlFor="new-post-para">PARA</SectionLabel>
              <div className="flex flex-wrap gap-[9px]">
                {kids.map((kid) => {
                  const active = selectedKids.includes(kid.name);
                  return (
                    <button
                      key={kid.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleKid(kid.name)}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-1.5 pr-[14px] pl-1.5 text-[14px] font-bold ${
                        active
                          ? "border-[#3F362E] bg-[#3F362E] text-white"
                          : `${neutralChip} hover:bg-[#F7EFE3]`
                      }`}
                    >
                      <span
                        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold ${KID_AVATAR_CLASSES[kid.avatarColor]}`}
                      >
                        {kid.initials}
                      </span>
                      {kid.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={allKidsSelected}
                  onClick={toggleWholeRoom}
                  className={`cursor-pointer rounded-full border-[1.5px] px-4 py-1.5 text-[14px] font-bold ${
                    allKidsSelected
                      ? "border-[#3F362E] bg-[#3F362E] text-white"
                      : `${neutralChip} hover:bg-[#F7EFE3]`
                  }`}
                >
                  Toda la sala
                </button>
              </div>
              {errors.para !== undefined && (
                <SectionError id="new-post-para-error" message={errors.para} />
              )}
            </div>

            {/* TIPO */}
            <div className="mt-[22px]">
              <SectionLabel htmlFor="new-post-tipo">TIPO</SectionLabel>
              <div className="flex flex-wrap gap-[9px]">
                {POST_TYPES.map((type) => {
                  const active = selectedTypes.includes(type);
                  const palette = TYPE_STYLES[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleType(type)}
                      style={
                        active
                          ? { backgroundColor: palette.bg, color: palette.text }
                          : undefined
                      }
                      className={`cursor-pointer rounded-full border px-4 py-2 text-[13.5px] font-extrabold ${
                        active
                          ? "border-transparent"
                          : `${neutralChip} hover:bg-[#F7EFE3]`
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              {errors.type !== undefined && (
                <SectionError id="new-post-tipo-error" message={errors.type} />
              )}
            </div>

            {/* DESCRIPCIÓN */}
            <div className="mt-[22px]">
              <SectionLabel htmlFor="new-post-text">DESCRIPCIÓN</SectionLabel>
              <textarea
                id="new-post-text"
                autoFocus
                value={text}
                onChange={updateText}
                placeholder="Contá cómo le fue hoy…"
                aria-invalid={errors.text !== undefined}
                aria-describedby={errors.text !== undefined ? "new-post-text-error" : undefined}
                className={`${fieldClass} min-h-[120px] resize-y text-ink leading-[1.5]`}
              />
              {errors.text !== undefined && (
                <SectionError id="new-post-text-error" message={errors.text} />
              )}
            </div>

            {/* FOTOS */}
            <div className="mt-[22px]">
              <SectionLabel htmlFor="new-post-photos">FOTOS</SectionLabel>
              <input
                ref={fileInputRef}
                id="new-post-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
              <div className="flex flex-wrap gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.url}
                    className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-[#ECE0D0]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar ${photo.name}`}
                      onClick={() => removePhoto(photo.url)}
                      className="absolute top-1 right-1 flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-full bg-[#C5503A] text-white shadow-md"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 cursor-pointer flex-none flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290] hover:bg-[#EFE5D7]"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C5503A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[12px]">Agregar</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
