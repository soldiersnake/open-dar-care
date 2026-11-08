-- SPEC 09 · 0004 — Create the `users` table + sync trigger with Supabase Auth
-- Source of truth: 07-DB-Schema/opendaycare-database-schema.md §2 users

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  daycare_id uuid not null references public.daycares (id),
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Generic trigger function: saves updated_at on every update. Reusable by future tables.
create or replace function public.set_updated_at ()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at ();

-- Sync trigger: creates the app profile when a user signs up in Supabase Auth.
-- daycare_id, role and full_name arrive via raw_user_meta_data in the signup.
create function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, status, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'active',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

comment on table public.users is
  'Perfil de aplicación vinculado a Supabase Auth. Padres y staff comparten tabla, diferenciados por role.';

comment on column public.users.id is
  'Mismo UUID que el usuario en auth.users (FK con ON DELETE CASCADE).';

comment on column public.users.daycare_id is
  'Guardería del usuario: 1 daycare tiene N usuarios y cada usuario pertenece a 1 daycare.';

comment on column public.users.role is
  'staff / parent / admin.';

comment on column public.users.status is
  'pending / active. Default active. El estado previo al signup se modela en invitations.';

comment on column public.users.full_name is
  'Nombre completo del usuario.';

comment on column public.users.avatar_url is
  'URL del avatar. Nullable.';

comment on column public.users.notify_on_post is
  'Avisos cuando publican (default true).';

comment on column public.users.daily_summary_enabled is
  'Resumen diario a las 19:00 (default true).';
