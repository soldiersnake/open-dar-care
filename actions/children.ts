"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type CreateChildResult =
  | { ok: true; childId: string }
  | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isIsoDate = (raw: string): boolean => {
  if (!ISO_DATE_PATTERN.test(raw)) return false;
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  // Rejects overflows like "2026-02-31" (Date rolls them over).
  return parsed.toISOString().slice(0, 10) === raw;
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

// Allergy tags arrive already in English (the UI translates them later).
// Normalize: trim, lowercase, drop empties and duplicates.
const parseAllergyTags = (raw: string): string[] => {
  const tags = raw.split(",").map((tag) => tag.trim().toLowerCase());
  return [...new Set(tags.filter((tag) => tag.length > 0))];
};

export async function createChild(
  _state: CreateChildResult | null,
  formData: FormData,
): Promise<CreateChildResult> {
  // Session check: a Server Action is an invocable endpoint. getClaims()
  // verifies the JWT signature on every call (never trust the cookie alone).
  const supabase = createClient(await cookies());
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    return { ok: false, error: "Sin sesión activa." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const roomId = String(formData.get("room_id") ?? "").trim();
  const enrolledAt = String(formData.get("enrolled_at") ?? "").trim() || todayIso();
  const allergyTags = parseAllergyTags(String(formData.get("allergy_tags") ?? ""));
  const photoConsentRaw = formData.get("photo_consent");
  const medicalNotes = String(formData.get("medical_notes") ?? "").trim() || null;
  const photoConsent = photoConsentRaw === null ? true : String(photoConsentRaw) !== "false";

  if (fullName.length === 0) {
    return { ok: false, error: "El nombre completo es obligatorio." };
  }

  if (!isIsoDate(birthDate) || birthDate > todayIso()) {
    return { ok: false, error: "La fecha de nacimiento es inválida." };
  }

  if (!isIsoDate(enrolledAt)) {
    return { ok: false, error: "La fecha de ingreso es inválida." };
  }

  if (!UUID_PATTERN.test(roomId)) {
    return { ok: false, error: "Selecciona una sala válida." };
  }

  // The admin client bypasses RLS: rooms and users still have no select
  // policies, so reading them with the session client would fail.
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("daycare_id")
    .eq("id", userId)
    .maybeSingle<{ daycare_id: string }>();

  if (!profile?.daycare_id) {
    return { ok: false, error: "Tu perfil no está vinculado a una guardería." };
  }

  const { data: room } = await admin
    .from("rooms")
    .select("id, daycare_id")
    .eq("id", roomId)
    .maybeSingle<{ id: string; daycare_id: string }>();

  if (!room) {
    return { ok: false, error: "La sala no existe." };
  }

  if (room.daycare_id !== profile.daycare_id) {
    return { ok: false, error: "La sala no pertenece a tu guardería." };
  }

  const { data: inserted, error } = await admin
    .from("children")
    .insert({
      room_id: roomId,
      full_name: fullName,
      birth_date: birthDate,
      enrolled_at: enrolledAt,
      medical_notes: medicalNotes,
      allergy_tags: allergyTags.length > 0 ? allergyTags : null,
      photo_consent: photoConsent,
      status: "active",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    return { ok: false, error: "No se pudo crear el niño." };
  }

  return { ok: true, childId: inserted.id };
}
