-- SPEC 15 · 0011 — Create the `invitations` and `parent_children` tables
-- Source of truth: 07-DB-Schema/opendaycare-database-schema.md §6 invitations / §5 parent_children

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id),
  invited_by uuid not null references public.users (id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_child_id_idx on public.invitations (child_id);

create index invitations_email_idx on public.invitations (lower (email));

alter table public.invitations enable row level security;

comment on table public.invitations is
  'Invitaciones para vincular a un padre con un niño. El staff genera un código corto y lo envía por email; al activar, el padre crea su cuenta y nace el vínculo en parent_children.';

comment on column public.invitations.id is
  'Identificador de la invitación.';

comment on column public.invitations.child_id is
  'Niño al que se vincula (FK → children).';

comment on column public.invitations.invited_by is
  'Usuario staff que envía la invitación (FK → users).';

comment on column public.invitations.full_name is
  'Nombre del padre/tutor invitado, tal como lo escribió el staff.';

comment on column public.invitations.email is
  'Email del padre/tutor invitado. Se guarda en minúsculas.';

comment on column public.invitations.relationship is
  'Parentesco declarado en la invitación (father / mother / guardian).';

comment on column public.invitations.code is
  'Código corto de 5 caracteres, único, ej. 7K4P9. Alfabeto sin caracteres ambiguos (sin O/I/L/0/1).';

comment on column public.invitations.status is
  'pending / accepted / expired / cancelled. Reinvitar al mismo email+niño cancela la previa y crea una nueva.';

comment on column public.invitations.expires_at is
  'Momento en que la invitación vence (created_at + 7 días). Se valida al usar el código; no hay job que marque expired.';

comment on column public.invitations.accepted_at is
  'Momento en que el padre activó la cuenta con el código. NULL mientras está pendiente.';

comment on column public.invitations.created_at is
  'Momento de creación de la invitación.';

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index parent_children_child_id_idx on public.parent_children (child_id);

create index parent_children_parent_id_idx on public.parent_children (parent_id);

alter table public.parent_children enable row level security;

comment on table public.parent_children is
  'Vínculo padre ↔ niño (tabla intermedia). Un padre puede tener varios hijos y un niño varios tutores.';

comment on column public.parent_children.id is
  'Identificador del vínculo.';

comment on column public.parent_children.parent_id is
  'Usuario padre/tutor (FK → users).';

comment on column public.parent_children.child_id is
  'Niño vinculado (FK → children).';

comment on column public.parent_children.relationship is
  'Parentesco del tutor con el niño (father / mother / guardian), tomado de la invitación aceptada.';

comment on column public.parent_children.created_at is
  'Momento en que se creó el vínculo (activación de la invitación).';
