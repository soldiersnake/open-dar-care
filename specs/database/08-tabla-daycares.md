# SPEC 08 — Tabla `daycares` + patrón de migraciones (Supabase)

> **Estado:** Implementado — Verificado ✅ por Verificador (spec-verifier), 7 nov 2026
> **Depende de:** ninguna
> **Fecha:** 2026-11-07
> **Objetivo:** Crear la primera tabla del esquema, `daycares`, en el proyecto remoto de Supabase usando el patrón de migraciones versionadas en `supabase/migrations/` aplicadas vía Supabase MCP, con RLS habilitado y 4 registros de prueba.

## Alcance

**Incluye:**

- Infraestructura del patrón de migraciones: carpeta `supabase/migrations/` en el repo (no existe hoy).
- Migración `0001_create_daycares.sql` con el DDL de la tabla:
  - `id` `uuid` PK, default `gen_random_uuid()`.
  - `name` `text` NOT NULL (ej. "Guardería Sala Soles").
  - `created_at` `timestamptz` NOT NULL, default `now()`.
  - `ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;` (sin policies).
  - Comentarios `COMMENT ON TABLE/COLUMN` en español para documentar la tabla.
- Migración `0002_seed_daycares.sql` con 4 registros de prueba (INSERT de nombres de guardería de ejemplo).
- Aplicación de ambas migraciones al proyecto remoto de Supabase vía MCP (`apply_migration`), en orden 0001 → 0002.
- Verificación contra el proyecto remoto al terminar cada aplicación (information_schema y conteo de filas).

**No incluye (diferido a otras specs):**

- Las demás tablas del esquema (`users`, `rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`) — cada una (o grupo) en su propia spec.
- Policies de RLS para `daycares` (la tabla queda con RLS on y deniega todo hasta que se definan).
- Tipos ENUM del esquema (`user_role`, `post_type`, etc.) — ninguno aplica a esta tabla.
- Conectar la app Next.js a Supabase (clientes supabase-js / @supabase/ssr).
- Rollback automatizado / down-migrations (el patrón es forward-only).

## Modelo de datos

Fuente de verdad: `07-DB-Schema/opendaycare-database-schema.md` §1 `daycares`.

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

Seed (`0002_seed_daycares.sql`), 4 registros de prueba:

```sql
insert into public.daycares (name) values
  ('Guardería Sala Soles'),
  ('Guardería Pequeños Pasos'),
  ('Guardería Rayito de Sol'),
  ('Guardería Colibrí');
```

Convención de idioma del doc: lo persistido va en inglés (aquí aplica a nombres SQL; los `name` son datos de negocio en español, igual que el doc).

## Plan de implementación

1. Crear `supabase/migrations/0001_create_daycares.sql` con el DDL de la sección Modelo de datos (create table + enable RLS + comments). Estado: archivo commiteable por sí solo.
2. Aplicar `0001` al proyecto remoto vía Supabase MCP (`apply_migration`, versión `0001`). Verificación: consultar `information_schema.columns` — la tabla existe con exactamente 3 columnas y RLS activo en `pg_tables`.
3. Crear `supabase/migrations/0002_seed_daycares.sql` con los 4 INSERT.
4. Aplicar `0002` al proyecto remoto vía MCP (versión `0002`). Verificación: `select count(*) from public.daycares` devuelve 4.

Precondición a validar en el paso 2: confirmar vía MCP (`list_migrations` / query) que la tabla `daycares` **no** existe todavía en el remoto (la referencia indica que el esquema no está implementado).

## Criterios de aceptación

- [x] Existe `supabase/migrations/0001_create_daycares.sql` y su contenido coincide con el modelo de datos de esta spec.
  - ✅ Verificado (7 nov 2026): leído en disco — DDL idéntico al bloque "Modelo de datos" (`create table` 3 columnas + comments + `enable row level security`). Commit `650ca79`.
- [x] Existe `supabase/migrations/0002_seed_daycares.sql` con exactamente 4 INSERT.
  - ✅ Verificado (7 nov 2026): leído en disco — 1 statement con 4 tuplas, nombres idénticos al bloque seed de la spec. Commit `650ca79`.
- [x] En el proyecto remoto, `information_schema.columns` muestra `daycares` con columnas `id` (uuid, PK), `name` (text NOT NULL) y `created_at` (timestamptz, default now()).
  - ✅ Verificado (7 nov 2026): query remota via Supabase MCP — `id` uuid default `gen_random_uuid()`, `name` text NOT NULL, `created_at` timestamp with time zone default `now()`; constraint `daycares_pkey` PRIMARY KEY presente.
- [x] RLS habilitado en `daycares` y sin policies de RLS todavía.
  - ✅ Verificado (7 nov 2026): `pg_class.relrowsecurity = true` y `pg_policies` count = 0.
- [x] `select count(*) from public.daycares` devuelve 4.
  - ✅ Verificado (7 nov 2026): `total = 4`, con `Guardería Sala Soles | Guardería Pequeños Pasos | Guardería Rayito de Sol | Guardería Colibrí`.
- [x] El historial de migraciones del remoto (`list_migrations`) contiene las versiones `0001` y `0002`.
  - ✅ Verificado (7 nov 2026): `0001_create_daycares` y `0002_seed_daycares` en el historial (junto a 2 migraciones de prueba previas del proyecto, que no tocan `daycares`).
- [x] Ningún archivo de la app fue modificado.
  - ✅ Verificado (7 nov 2026): `git diff --stat 306f9d1..HEAD` = solo `specs/08-tabla-daycares.md` + 2 archivos de `supabase/migrations/`; working tree limpio.

## Decisiones

- **Sí:** archivos SQL versionados en `supabase/migrations/` + aplicación vía Supabase MCP (`apply_migration`). Deja historial en el repo y en el remoto sin requerir CLI vinculada (decisión del usuario).
- **No:** `npx supabase db push`. Requiere instalar y vincular la CLI; con MCP ya alcanza para este proyecto.
- **No:** SQL directo sin archivos. Pierde el patrón de migraciones versionadas que se pidió.
- **Sí:** esquema exactamente como la doc §1 (sin `updated_at`). La doc es la fuente de verdad y no lista `updated_at` para esta tabla.
- **No:** trigger de `updated_at`. La tabla no lo lleva en la doc.
- **Sí:** RLS habilitado al crear la tabla, sin policies. Best practice de Supabase: nunca crear tablas expuestas sin RLS.
- **No:** policies de lectura en esta migración. Diseñar policies requiere decidir el modelo de acceso de `users`; se difiere.
- **Sí:** seed en una migración separada (`0002`), no mezclado con el DDL. Permite revertir/re-ejecutar datos sin tocar el esquema (decisión del usuario: 4 registros).
- **No:** más de una guardería "semilla" canónica. Son datos de prueba, no fixtures de la app.

## Riesgos

| Riesgo                                                        | Mitigación                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| La tabla ya existe en el remoto (habría conflicto con `0001`) | Precondición del paso 2: inspeccionar el remoto con MCP antes de aplicar; si existe, parar y consultar al usuario. |
| Seed accidental duplicado (aplicar `0002` dos veces)          | El historial de migraciones de Supabase registra cada versión aplicada; re-verificar `count(*) = 4`, no 8.         |

## Qué **no** está en esta spec

- Otras tablas del esquema (una spec por tabla o grupo).
- Policies de RLS.
- Conexión de la app Next.js a Supabase.
- Seed de producción / fixtures reales.

Cada uno de esos, si aterriza, va en su propia spec.
