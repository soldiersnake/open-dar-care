// SPEC 11 — Verification script for the children POST contract.
// Runs with: node --env-file=.env scripts/verify-0009-children-post.mjs
//
// Performs the same insert the createChild Server Action performs (service
// role client), verifies the row against the schema, checks the updated_at
// trigger, then deletes its own test row. Idempotent: at the end
// public.children has 0 rows and public.rooms keeps its 3 seeded rooms.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno (usar: node --env-file=.env).",
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const today = new Date().toISOString().slice(0, 10);
const allTagsInput = ["Lactose", "peanut ", "peanut"]; // must normalize to ["lactose","peanut"]
const expectedTags = ["lactose", "peanut"];

// Resolve the seeded "Soles" room of "Guardería Sala Soles" (lookup by name,
// same rule as the 0008 seed).
const { data: room, error: roomError } = await admin
  .from("rooms")
  .select("id, name, daycares ( name )")
  .eq("name", "Soles")
  .maybeSingle();

if (roomError || !room) {
  console.error("No se encontró la sala Soles de Guardería Sala Soles:", roomError ?? "sin datos");
  process.exit(1);
}

console.log(`Sala Soles OK (daycare: ${room.daycares?.name ?? "?"}).
Insertando niño de prueba...`);

// Same normalization the createChild Server Action applies before inserting.
const normalizeTags = (raw) => {
  const tags = raw.map((tag) => tag.trim().toLowerCase());
  return [...new Set(tags.filter((tag) => tag.length > 0))];
};
const allergy_tags = normalizeTags(allTagsInput);

const { data: inserted, error: insertError } = await admin
  .from("children")
  .insert({
    room_id: room.id,
    full_name: "Niño De Prueba",
    birth_date: "2022-03-12",
    enrolled_at: today,
    medical_notes: null,
    allergy_tags: allergy_tags,
    photo_consent: true,
    status: "active",
  })
  .select(
    "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at",
  )
  .single();

if (insertError || !inserted) {
  console.error("Insert falló:", insertError);
  process.exit(1);
}

const checks = [
  ["status === 'active'", inserted.status === "active"],
  ["room_id === sala Soles", inserted.room_id === room.id],
  ["full_name persistido", inserted.full_name === "Niño De Prueba"],
  ["birth_date persistida", inserted.birth_date === "2022-03-12"],
  ["enrolled_at === hoy", inserted.enrolled_at === today],
  ["medical_notes === null", inserted.medical_notes === null],
  ["allergy_tags normalizadas", JSON.stringify(inserted.allergy_tags) === JSON.stringify(expectedTags)],
  ["photo_consent === true", inserted.photo_consent === true],
];

let failed = false;
for (const [label, pass] of checks) {
  console.log(`${pass ? "✔" : "✘"} ${label}`);
  if (!pass) failed = true;
}

// Trigger check: an update must refresh updated_at (set_children_updated_at).
const { data: updatedRows } = await admin
  .from("children")
  .update({ full_name: "Niño De Prueba Renombrado" })
  .eq("id", inserted.id)
  .select("full_name, updated_at")
  .single();

const triggerPass = Boolean(updatedRows?.updated_at && updatedRows.updated_at !== inserted.updated_at);
console.log(`${triggerPass ? "✔" : "✘"} trigger set_updated_at (updated_at cambió)`);
if (!triggerPass) failed = true;

const { data: removed, error: deleteError } = await admin
  .from("children")
  .delete()
  .eq("id", inserted.id)
  .select("id");

if (deleteError || !removed || removed.length !== 1) {
  console.error("Delete falló:", deleteError ?? "no se eliminó la fila");
  process.exit(1);
}
console.log("✔ niño de prueba eliminado");

const { count: childrenLeft } = await admin
  .from("children")
  .select("id", { count: "exact", head: true });
const { data: roomsLeft } = await admin.from("rooms").select("id");
console.log(`${childrenLeft === 0 ? "✔" : "✘"} children = ${childrenLeft} (esperado 0)`);
console.log(`${roomsLeft?.length === 3 ? "✔" : "✘"} rooms = ${roomsLeft?.length} (esperado 3)`);
if (childrenLeft !== 0 || roomsLeft?.length !== 3) failed = true;

if (failed) {
  console.error("Resultado: FALLO — hay checks fallidos.");
  process.exit(1);
}
console.log("Resultado: OK — script idempotente termina con children = 0 y rooms = 3.");
