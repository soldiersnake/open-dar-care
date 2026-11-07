-- SPEC 08, paso 2 (0001): crea la tabla raiz del esquema.
-- Fuente: 07-DB-Schema/opendaycare-database-schema.md, seccion 1 (daycares).

create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.daycares is 'La guarderia como entidad raiz del esquema. Todas las demas tablas cuelgan de ella (rooms, users, children).';
comment on column public.daycares.id is 'Identificador unico de la guarderia (uuid generado).';
comment on column public.daycares.name is 'Nombre comercial de la guarderia, ej. "Guarderia Sala Soles".';
comment on column public.daycares.created_at is 'Fecha de creacion del registro (UTC).';

-- RLS habilitado desde la creacion: la tabla queda cerrada (deniega todo)
-- hasta que una spec futura defina las policies de acceso.
alter table public.daycares enable row level security;
