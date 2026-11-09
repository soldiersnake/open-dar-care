-- SPEC 11 · 0009 — Create the `children` table + `child_status` enum
-- Source of truth: 07-DB-Schema/opendaycare-database-schema.md §4 children

create type public.child_status as enum ('active', 'archived');

comment on type public.child_status is
  'Estado del niño: active = inscrito, archived = dado de baja (borrado lógico).';

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text,
  allergy_tags text[],
  photo_consent boolean not null default true,
  status public.child_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.children enable row level security;

-- Reuses set_updated_at() (created in 0004 as a reusable trigger function).
create trigger set_children_updated_at
  before update on public.children
  for each row execute function public.set_updated_at ();

comment on table public.children is
  'Niños inscritos en la guardería. Cada niño pertenece a 1 sala.';

comment on column public.children.id is
  'Identificador del niño.';

comment on column public.children.room_id is
  'Sala a la que pertenece el niño (FK → rooms).';

comment on column public.children.full_name is
  'Nombre completo del niño.';

comment on column public.children.birth_date is
  'Fecha de nacimiento.';

comment on column public.children.enrolled_at is
  'Fecha de ingreso a la guardería. No tiene default en DB: la app la aplica.';

comment on column public.children.medical_notes is
  'Alergias y notas médicas (texto libre). Nullable.';

comment on column public.children.allergy_tags is
  'Etiquetas de alergia en inglés, ej. {peanut}. La UI las traduce a español.';

comment on column public.children.photo_consent is
  'Consentimiento de fotos (default true).';

comment on column public.children.status is
  'active / archived (borrado lógico). Sin default en DB: la app inserta active.';
