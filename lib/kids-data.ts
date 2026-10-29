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
  id: number;
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
};

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
