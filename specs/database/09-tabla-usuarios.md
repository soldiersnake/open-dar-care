# SPEC 09 — Tabla `users` + enums `user_role` / `user_status` (Supabase)

> **Estado:** Aprobado
> **Depende de:** SPEC 08 (tabla `daycares` creada y con 4 registros de prueba)
> **Fecha:** 2026-11-07
> **Objetivo:** Crear la tabla `users` y sus enums `user_role` / `user_status` en el proyecto remoto de Supabase con el patrón de migraciones versionadas, incluyendo el trigger de sincronización con Supabase Auth y un usuario staff de prueba vinculado a una guardería existente, de modo que 1 usuario pertenece a 1 daycare vía `users.daycare_id` y un daycare tiene N usuarios.

## Alcance

**Incluye:**

- Migración `0003_create_user_enums.sql` con los dos enums que la tabla `users` necesita:
  - `user_role`: `staff`, `parent`, `admin`.
  - `user_status`: `pending`, `active`.
  - Comentarios `COMMENT ON TYPE` en español documentando cada enum.
- Migración `0004_create_users.sql` con el DDL de la tabla `users`:
  - `id` `uuid` PK, FK → `auth.users(id)` `ON DELETE CASCADE` (mismo UUID que Supabase Auth; sin default — lo crea Auth).
  - `daycare_id` `uuid` NOT NULL, FK → `public.daycares(id)` (la relación 1 daycare → N usuarios).
  - `role` `public.user_role` NOT NULL.
  - `status` `public.user_status` NOT NULL, default `'active'`.
  - `full_name` `text` NOT NULL.
  - `avatar_url` `text` nullable.
  - `notify_on_post` `boolean` NOT NULL, default `true`.
  - `daily_summary_enabled` `boolean` NOT NULL, default `true`.
  - `created_at` / `updated_at` `timestamptz` NOT NULL, default `now()`.
  - Trigger `before update` en `public.users` con función `set_updated_at()` que refresca `updated_at`.
  - Función `handle_new_user()` `SECURITY DEFINER` + trigger `on_auth_user_created` `AFTER INSERT` en `auth.users`: toma `daycare_id`, `role` y `full_name` de `raw_user_meta_data` e inserta la fila de perfil con `status = 'active'`.
  - `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;` (sin policies — RLS on y deniega todo hasta diseñarlas con el modelo de acceso).
  - Comentarios `COMMENT ON TABLE/COLUMN` en español.
- Migración `0005_seed_staff_user.sql` con 1 usuario staff de prueba:
  - INSERT en `auth.users` vía SQL admin (password hasheado con `crypt(..., gen_salt('bf'))`, email confirmado, `raw_app_meta_data` / `raw_user_meta_data` estándar de Auth).
  - `raw_user_meta_data` lleva `daycare_id` (lookup por nombre → `Guardería Sala Soles`), `role = 'staff'` y `full_name = 'Ana Martínez'`.
  - El propio trigger `on_auth_user_created` genera la fila de perfil; la migración NO inserta en `public.users` a mano.
- Aplicación de las 3 migraciones al proyecto remoto vía Supabase MCP (`apply_migration`), en orden 0003 → 0004 → 0005.
- Verificación contra el remoto después de cada aplicación (`pg_type`, `information_schema`, triggers de `auth.users`, conteo de filas), igual que en la SPEC 08.

**No incluye (diferido a otras specs):**

- Los demás enums del esquema (`relationship_type`, `invitation_status`, `post_type`, `child_status`) — se crean con su tabla correspondiente.
- Policies de RLS para `users` (la tabla queda con RLS on y deniega todo hasta definirlas).
- El flujo de signup desde la app Next.js (`supabase-js` completando `raw_user_meta_data`).
- Seed de usuarios parent / más usuarios de prueba.
- Login real contra Auth (supabase-js / @supabase/ssr) para comprobar la contraseña del usuario seed.
- Las demás tablas del esquema (`rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.).
- Insertar la fila del usuario en `auth.identities` (la fila es suficiente para FK, perfil y queries admin; ver Decisiones).

## Modelo de datos

Fuente de verdad: `07-DB-Schema/opendaycare-database-schema.md` — enums §`user_role` / `user_status` y §2 `users`.

Enums (`0003_create_user_enums.sql`):

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');
```

Tabla (`0004_create_users.sql`):

```sql
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
```

Función `set_updated_at()` (reutilizable por tablas futuras) + trigger `before update` en `public.users`.

Función de sincronización (`0004_create_users.sql`):

```sql
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
```

Seed (`0005_seed_staff_user.sql`) — usuario staff de prueba:

- Email: `staff@opendaycare.test`
- Password (para pruebas posteriores): `DayCare2026!` (persistida hasheada con `crypt`, nunca en claro)
- `full_name`: `Ana Martínez`
- `role`: `staff`
- `daycare_id`: el de `Guardería Sala Soles` (resuelto con un lookup por nombre en la misma sentencia; los `id` son `gen_random_uuid()`, no se fijan a mano).

Convenciones: PK `id` `uuid`, `created_at` / `updated_at` `timestamptz`. Idioma del doc: lo persistido va en inglés (valores de enums); nombres de personas en español, igual que la doc.

## Plan de implementación

1. Precondición (vía Supabase MCP): con `list_migrations` y queries de catálogo (`pg_type`, `information_schema.tables`, `pg_proc`, triggers de `auth.users`) confirmar que **no** existen aún los enums `user_role`/`user_status`, la tabla `users`, la función `handle_new_user()` ni el trigger `on_auth_user_created` en el remoto. Si algo existe, parar y consultar al usuario.
2. Crear `supabase/migrations/0003_create_user_enums.sql` con los 2 `create type` + comentarios. Estado: archivo commiteable por sí solo.
3. Aplicar `0003` al proyecto remoto vía MCP (`apply_migration`, versión `0003`). Verificación: `pg_type` muestra los 2 enums con los valores exactos de la doc.
4. Crear `supabase/migrations/0004_create_users.sql` con tabla, RLS, comments, función `set_updated_at()` + su trigger, y función `handle_new_user()` + trigger `on_auth_user_created`.
5. Aplicar `0004` vía MCP (versión `0004`). Verificación: `information_schema.columns` muestra `users` con exactamente las 10 columnas y sus tipos/default; FKs a `auth.users` (CASCADE) y `daycares` presentes; `relrowsecurity = true` y `pg_policies` count = 0; el trigger `on_auth_user_created` existe en `auth.users`.
6. Crear `supabase/migrations/0005_seed_staff_user.sql` con el INSERT admin del usuario staff (1 statement, lookup del `daycare_id` por nombre).
7. Aplicar `0005` vía MCP (versión `0005`). Verificación: `auth.users` tiene 1 fila con `email = staff@opendaycare.test` y email confirmado; `public.users` tiene 1 fila cuyo `id` coincide (creada por el trigger), con `role = 'staff'`, `status = 'active'`, `full_name = 'Ana Martínez'` y `daycare_id` apuntando a `Guardería Sala Soles`.

Cada paso con DDL aplicado deja el remoto en un estado consistente; el commit se hace después de cada paso verificado.

## Criterios de aceptación

- [ ] Existe `supabase/migrations/0003_create_user_enums.sql` y su contenido coincide con el modelo de datos de esta spec.
- [ ] En el remoto, `pg_type` muestra `public.user_role` con valores `staff/parent/admin` y `public.user_status` con `pending/active`.
- [ ] Existe `supabase/migrations/0004_create_users.sql` y su contenido coincide con el modelo de datos de esta spec.
- [ ] En el remoto, `information_schema.columns` muestra `users` con exactamente 10 columnas: `id` (uuid PK, FK→`auth.users` CASCADE), `daycare_id` (uuid NOT NULL, FK→`daycares`), `role` (user_role NOT NULL), `status` (user_status NOT NULL default `active`), `full_name` (text NOT NULL), `avatar_url` (text nullable), `notify_on_post` y `daily_summary_enabled` (boolean NOT NULL default true), `created_at` y `updated_at` (timestamptz NOT NULL default now()).
- [ ] RLS habilitado en `users` y sin policies de RLS todavía (`pg_policies` count = 0).
- [ ] Un UPDATE sobre una fila de `users` refresca `updated_at` automáticamente (trigger `set_updated_at`).
- [ ] El trigger `on_auth_user_created` existe sobre `auth.users` y apunta a la función `handle_new_user()` (SECURITY DEFINER).
- [ ] Existe `supabase/migrations/0005_seed_staff_user.sql` con 1 INSERT en `auth.users`.
- [ ] En el remoto, `auth.users` tiene la fila de `staff@opendaycare.test` con email confirmado, y `public.users` tiene su perfil creado por el trigger con `role = 'staff'`, `status = 'active'`, `full_name = 'Ana Martínez'` y `daycare_id` = el de `Guardería Sala Soles`.
- [ ] El historial de migraciones del remoto (`list_migrations`) contiene las versiones `0003`, `0004` y `0005`.
- [ ] Ningún archivo de la app fue modificado (el diff queda limitado a `specs/09-tabla-usuarios.md` + los 3 archivos de `supabase/migrations/`).

## Decisiones

- **Sí:** solo los enums `user_role` y `user_status` en esta migración (decisión del usuario). Los otros 4 enums pertenecen a tablas que aún no existen y se crean con cada una; anticiparlos ahora los dejaría huérfanos.
- **No:** crear los 6 enums del documento de una vez. Viola el patrón de una spec = una tabla y complica re-ejecutar migraciones.
- **Sí:** incluir el trigger `on_auth_user_created` + `handle_new_user()` (decisión del usuario). Sin él no hay forma de crear perfiles de `users` desde el signup; es la implementación que la propia doc §2 recomienda.
- **Sí:** `daycare_id` NOT NULL sin default (decisión del usuario). Todo usuario nace con guardería asignada vía `raw_user_meta_data`; modela explícitamente la relación 1 daycare → N usuarios.
- **Sí:** usuario staff de prueba vía SQL admin en `auth.users` con `crypt()`, no manual en dashboard. Los ids de `daycares` son uuid generados, así que el lookup se hace por nombre en la misma sentencia; queda reproducible en la migración.
- **No:** insertar el perfil en `public.users` a mano en el seed. Deliberadamente lo genera el trigger: es también la primera prueba de que `on_auth_user_created` funciona.
- **No:** insertar la fila de `auth.identities` del usuario seed. Para FK, perfil y queries admin no hace falta; un login real con supabase-js requeriría completarla, y ese flujo (signup de la app) es de otra spec.
- **Sí:** `status = 'active'` fijo en el trigger, no tomado de `raw_user_meta_data`. La doc dice default `active` y el estado previo al signup se modela en `invitations`, no aquí.
- **No:** duplicar `email` ni `password_hash` en `public.users`. Supabase ya los gestiona en `auth.users`; la tabla solo guarda datos de dominio.
- **Sí:** función `set_updated_at()` genérica con trigger `before update` (decisión del usuario). La doc convención establece `created_at`/`updated_at` para esta tabla; hacerlo genérico lo reutilizan las tablas futuras que también la llevan.
- **Sí:** RLS habilitado al crear la tabla, sin policies (mismo criterio que SPEC 08: nunca crear tablas expuestas sin RLS; diseñar policies exige decidir el modelo de acceso por rol).

## Riesgos

| Riesgo                                                                                                                           | Mitigación                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El trigger sobre `auth.users` corre para **cualquier** insert futuro del dashboard/auth                                          | El seed es el único insert previsto en esta spec; cualquier alta manual en el dashboard fallará si no lleva `raw_user_meta_data` completo — comportamiento esperado documentado. |
| Un insert en `auth.users` sin `daycare_id`/`role`/`full_name` en `raw_user_meta_data` rompe (NULL en FK NOT NULL / cast fallido) | Es el error deseado (fail-fast) en desarrollo; los signups reales de la app llegarán con el payload completo, en otra spec.                                                      |
| Ya existe una función/trigger de sincronización previo en el remoto (migraciones de prueba previas)                              | Precondición del paso 1: inspeccionar el catálogo antes de aplicar `0004`; si existe, parar y consultar al usuario.                                                              |
| Query del seed con múltiples guarderías del mismo nombre duplicaría filas                                                        | `Guardería Sala Soles` es única en el seed de `0002`; la sentencia usa lookup por nombre exacto y el conteo de verificación espera exactamente 1 fila.                           |

## Qué **no** está en esta spec

- Enums de otras tablas (`relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Policies de RLS para `users`.
- Flujo de signup desde la app Next.js y login de prueba con el usuario staff.
- Más usuarios de prueba (parent u otros staff).
- Otras tablas del esquema.

Cada uno de esos, si aterriza, va en su propia spec.
