export type ParentStatus = "active" | "pending";

export type LinkedParent = {
  id: number;
  name: string;
  relation: string;
  status: ParentStatus;
  avatarColor: "purple" | "blue";
  note: string;
};

export type Kid = {
  id: number | string; // number for mock rows; uuid string for real children (SPEC 12)
  name: string;
  age: number;
  initials: string;
  avatarColor: "sky" | "pink" | "green" | "yellow" | "purple";
  allergiesNote?: string;
  allergyTag?: string;
  birthDate: string;
  room: string;
  entryDate: string;
  parents: LinkedParent[];
  medicalNotes?: string;
};

export const ROOMS = ["Soles", "Lunas", "Estrellas"] as const;

// Parentesco chips of the link-parent modal; "Mamá" is the modal's default
export const INVITATION_RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
export const INVITATION_CODE_LENGTH = 5;
// Capitals and digits without ambiguous characters (no O/I/L or 0/1)
export const INVITATION_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// The form filled in the add-kid modal (values as typed, before derivation)
export type KidDraft = {
  name: string;
  birthDate: string; // ISO date from <input type="date"> (e.g. "2022-03-12")
  room: string;
  allergies: string; // comma-separated tags (e.g. "Maní, Lactosa")
  notes: string;
};

// The form filled in the link-parent modal (values as typed, before derivation)
export type LinkedParentDraft = {
  name: string;
  email: string;
  relation: string; // an option of INVITATION_RELATIONS
};

const AVATAR_COLOR_PALETTE = ["sky", "pink", "green", "yellow", "purple"] as const;

const MONTH_ABBREVIATIONS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

// Derives a mock Kid from the add-kid modal draft; same shape as the static kids.
export function createKidFromForm(draft: KidDraft, nextId: number, now = new Date()): Kid {
  const allergyTags = draft.allergies
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const name = draft.name.trim();
  const birth = new Date(`${draft.birthDate}T00:00:00`);
  const birthdayNotReachedYet =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  const age = now.getFullYear() - birth.getFullYear() - (birthdayNotReachedYet ? 1 : 0);

  const kid: Kid = {
    id: nextId,
    name,
    age,
    initials: name.charAt(0).toUpperCase(),
    avatarColor: AVATAR_COLOR_PALETTE[(nextId - 1) % AVATAR_COLOR_PALETTE.length],
    birthDate: draft.birthDate,
    room: draft.room,
    entryDate: `${MONTH_ABBREVIATIONS[now.getMonth()]} ${now.getFullYear()}`,
    parents: [],
  };

  if (allergyTags.length > 0) {
    kid.allergyTag = allergyTags[0].toUpperCase();
    kid.allergiesNote = `Alergia a ${allergyTags.map((tag) => tag.toLowerCase()).join(", ")}.`;
  }

  const notes = draft.notes.trim();
  if (notes.length > 0) {
    kid.medicalNotes = notes;
  }

  return kid;
}

// Random invitation code for the link-parent modal; generated on modal open,
// never during the initial render (random values must not reach the SSR tree).
export function generateInvitationCode(): string {
  let code = "";
  for (let index = 0; index < INVITATION_CODE_LENGTH; index++) {
    const pick = Math.floor(Math.random() * INVITATION_CODE_ALPHABET.length);
    code += INVITATION_CODE_ALPHABET.charAt(pick);
  }
  return code;
}

// Derives a pending LinkedParent row from the link-parent modal draft; same
// shape as the static parents. Odd ids get purple, even ids blue — the mock
// rows follow the same odd/even pattern.
export function createPendingParentFromForm(
  draft: LinkedParentDraft,
  nextId: number,
): LinkedParent {
  return {
    id: nextId,
    name: draft.name.trim(),
    relation: draft.relation,
    status: "pending",
    avatarColor: nextId % 2 === 1 ? "purple" : "blue",
    note: draft.email.trim(),
  };
}

export const kids: Kid[] = [
  {
    id: 1,
    name: "Mateo Fernández",
    age: 3,
    initials: "M",
    avatarColor: "sky",
    allergiesNote:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    allergyTag: "MANÍ",
    birthDate: "12 mar 2022",
    room: "Soles",
    entryDate: "feb 2025",
    parents: [
      {
        id: 1,
        name: "Lucía Fernández",
        relation: "Mamá",
        status: "active",
        avatarColor: "purple",
        note: "activa",
      },
      {
        id: 2,
        name: "Diego Fernández",
        relation: "Papá",
        status: "pending",
        avatarColor: "blue",
        note: "invitación enviada",
      },
    ],
  },
  {
    id: 2,
    name: "Sofía Méndez",
    age: 2,
    initials: "S",
    avatarColor: "pink",
    birthDate: "3 jun 2024",
    room: "Soles",
    entryDate: "mar 2025",
    parents: [
      {
        id: 1,
        name: "Carla Méndez",
        relation: "Mamá",
        status: "active",
        avatarColor: "purple",
        note: "activa",
      },
    ],
  },
  {
    id: 3,
    name: "Benjamín Ruiz",
    age: 3,
    initials: "B",
    avatarColor: "green",
    birthDate: "25 jul 2023",
    room: "Soles",
    entryDate: "feb 2025",
    parents: [
      {
        id: 1,
        name: "Martín Ruiz",
        relation: "Papá",
        status: "active",
        avatarColor: "blue",
        note: "activa",
      },
      {
        id: 2,
        name: "Paula Gómez",
        relation: "Mamá",
        status: "active",
        avatarColor: "purple",
        note: "activa",
      },
    ],
  },
  {
    id: 4,
    name: "Valentina Soto",
    age: 2,
    initials: "V",
    avatarColor: "yellow",
    birthDate: "8 sep 2024",
    room: "Soles",
    entryDate: "ago 2025",
    parents: [],
  },
  {
    id: 5,
    name: "Tomás Díaz",
    age: 3,
    initials: "T",
    avatarColor: "purple",
    allergiesNote: "Intolerancia a la lactosa. Se le entrega leche vegetal.",
    allergyTag: "LACTOSA",
    birthDate: "30 ene 2023",
    room: "Soles",
    entryDate: "mar 2025",
    parents: [
      {
        id: 1,
        name: "Javier Díaz",
        relation: "Papá",
        status: "pending",
        avatarColor: "blue",
        note: "invitación enviada",
      },
    ],
  },
  {
    id: 6,
    name: "Emma Castro",
    age: 2,
    initials: "E",
    avatarColor: "pink",
    birthDate: "17 feb 2024",
    room: "Soles",
    entryDate: "feb 2026",
    parents: [
      {
        id: 1,
        name: "Rocío Castro",
        relation: "Mamá",
        status: "active",
        avatarColor: "purple",
        note: "activa",
      },
    ],
  },
  {
    id: 7,
    name: "Lucas Romero",
    age: 3,
    initials: "L",
    avatarColor: "sky",
    birthDate: "5 abr 2023",
    room: "Soles",
    entryDate: "jul 2025",
    parents: [
      {
        id: 1,
        name: "Nicolás Romero",
        relation: "Papá",
        status: "active",
        avatarColor: "blue",
        note: "activa",
      },
    ],
  },
  {
    id: 8,
    name: "Olivia Vega",
    age: 2,
    initials: "O",
    avatarColor: "green",
    birthDate: "23 dic 2024",
    room: "Soles",
    entryDate: "oct 2026",
    parents: [
      {
        id: 1,
        name: "Silvina Vega",
        relation: "Mamá",
        status: "active",
        avatarColor: "purple",
        note: "activa",
      },
    ],
  },
];

export function getKidById(id: number): Kid | undefined {
  return kids.find((kid) => kid.id === id);
}

// ---------- SPEC 12: /kids reads real children (server-side derivation) ----------

// Options of the add-kid modal room select as they arrive from the server.
export type RoomOption = {
  id: string; // rooms.id uuid (SPEC 11)
  name: string;
};

// English allergy tags (DB) translated to the Spanish labels the mock uses.
const ALLERGY_TAG_UI: Record<string, string> = {
  peanut: "maní",
  lactose: "lactosa",
  gluten: "gluten",
  egg: "huevo",
  dairy: "lacteos",
  soy: "soja",
  fish: "pescado",
  nuts: "frutos secos",
  pollen: "polen",
  penicillin: "penicilina",
};

const translateAllergyTag = (tag: string): string =>
  ALLERGY_TAG_UI[tag.trim().toLowerCase()] ?? tag.trim().toLowerCase();

// Row shape the server page selects from public.children (SPEC 11 schema).
export type DbChildRow = {
  id: string;
  full_name: string;
  birth_date: string; // ISO date
  enrolled_at: string; // ISO date
  allergy_tags: string[] | null;
  medical_notes: string | null;
  rooms: { name: string } | { name: string }[] | null;
};

// Derives a display Kid from a real children row. Server-side only: it uses
// `new Date()` for the age paper-trail, which keeps the client render
// deterministic (SPEC 05: no non-deterministic values in the render tree).
export function kidFromDbRow(row: DbChildRow, rowAt: number = 0, now = new Date()): Kid {
  const name = row.full_name.trim();
  const birth = new Date(`${row.birth_date}T00:00:00`);
  const enrolled = new Date(`${row.enrolled_at}T00:00:00`);
  const birthdayNotReachedYet =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());

  const kid: Kid = {
    id: row.id,
    name,
    age: now.getFullYear() - birth.getFullYear() - (birthdayNotReachedYet ? 1 : 0),
    initials: name.charAt(0).toUpperCase(),
    avatarColor: AVATAR_COLOR_PALETTE[rowAt % AVATAR_COLOR_PALETTE.length],
    birthDate: `${birth.getDate()} ${MONTH_ABBREVIATIONS[birth.getMonth()]} ${birth.getFullYear()}`,
    room: roomName(row),
    entryDate: `${MONTH_ABBREVIATIONS[enrolled.getMonth()]} ${enrolled.getFullYear()}`,
    parents: [],
  };

  const tags = (row.allergy_tags ?? []).filter((tag) => tag.trim().length > 0);
  if (tags.length > 0) {
    const labels = tags.map(translateAllergyTag);
    kid.allergyTag = labels[0].toUpperCase();
    kid.allergiesNote = `Alergia a ${labels.join(", ")}.`;
  }

  if (row.medical_notes && row.medical_notes.trim().length > 0) {
    kid.medicalNotes = row.medical_notes;
  }

  return kid;
}

function roomName(row: DbChildRow): string {
  const relation = row.rooms;
  if (Array.isArray(relation)) return relation[0]?.name ?? "";
  return relation?.name ?? "";
}

