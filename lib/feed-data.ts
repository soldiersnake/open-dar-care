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
