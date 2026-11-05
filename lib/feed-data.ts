export type Category = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  authorInitials: string; // the announcement post uses a megaphone icon instead
  name: string;
  time: string;
  postedBy: string;
  category: Category;
  recipients: string;
  text: string;
  photoCaption?: string; // only ACTIVITY posts: dashed photo placeholder
  likes: number;
  comments: number;
};

export type NavIcon = "feed" | "kids" | "notices" | "account";

export type NavItem = {
  label: string;
  icon: NavIcon;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Feed", icon: "feed", href: "/" },
  { label: "Niños", icon: "kids", href: "/kids" },
  { label: "Avisos", icon: "notices", href: "#" },
  { label: "Mi cuenta", icon: "account", href: "#" },
];

export const mockUser = {
  initials: "C",
  name: "Caro Giménez",
  role: "Maestra · Soles",
};

export const homeHeader = {
  eyebrow: "GUARDERÍA · SALA SOLES",
  greeting: "Buenas, Caro",
  summary: "12 niños · martes 17 jun",
};

export const POST_TYPES = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
] as const;

export type PostType = (typeof POST_TYPES)[number];

// Maps modal types onto the 3 visual categories the feed already renders
export const TYPE_TO_CATEGORY: Record<PostType, Category> = {
  Comida: "activity",
  Siesta: "activity",
  Actividad: "activity",
  Logro: "achievement",
  Ánimo: "activity",
  Foto: "activity",
  Anuncio: "announcement",
};

export type PostDraft = {
  kidNames: string[]; // empty when wholeRoom
  wholeRoom: boolean; // "Toda la sala" chip active
  types: PostType[]; // in selection order; the first one sets the badge
  text: string;
  photoCount: number; // locally chosen photos (no upload)
};

function formatTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function firstInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function createPostFromForm(draft: PostDraft, existingCount: number): Post {
  const firstType = draft.types[0];
  const category = TYPE_TO_CATEGORY[firstType];

  let name: string;
  let authorInitials: string;
  let recipients: string;

  if (draft.wholeRoom) {
    name = "Anuncio general";
    authorInitials = ""; // the announcement card shows a megaphone icon instead
    recipients = "toda la sala";
  } else {
    name = draft.kidNames[0];
    authorInitials = firstInitial(name);
    recipients =
      draft.kidNames.length === 1
        ? `familia de ${name}`
        : `familias de ${draft.kidNames.length} niños`;
  }

  return {
    id: `post-nueva-${existingCount + 1}`,
    authorInitials,
    name,
    time: formatTime(new Date()),
    postedBy: "publicado por vos",
    category,
    recipients,
    text: draft.text,
    photoCaption: draft.photoCount > 0 ? `Foto · ${draft.photoCount} imagen/es` : undefined,
    likes: 0,
    comments: 0,
  };
}

export const posts: Post[] = [
  {
    id: "post-logro-mateo",
    authorInitials: "M",
    name: "Mateo",
    time: "14:20",
    postedBy: "publicado por vos",
    category: "achievement",
    recipients: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "post-actividad-mateo",
    authorInitials: "M",
    name: "Mateo",
    time: "09:40",
    postedBy: "publicado por vos",
    category: "activity",
    recipients: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoCaption: "Foto · pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "post-anuncio-sala",
    authorInitials: "",
    name: "Anuncio general",
    time: "07:50",
    postedBy: "publicado por vos",
    category: "announcement",
    recipients: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
