-- SPEC 11 · 0007 — Create the `rooms` table (daycare rooms)
-- Source of truth: 07-DB-Schema/opendaycare-database-schema.md §3 rooms

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

comment on table public.rooms is
  'Salas de la guardería. 1 daycare tiene N salas y cada sala pertenece a 1 daycare.';

comment on column public.rooms.id is
  'Identificador de la sala.';

comment on column public.rooms.daycare_id is
  'Guardería a la que pertenece la sala.';

comment on column public.rooms.name is
  'Nombre de la sala. Ej. "Soles".';

comment on column public.rooms.created_at is
  'Fecha de creación de la sala.';
