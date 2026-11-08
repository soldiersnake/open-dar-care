# SPEC 11 — Tablas `rooms` + `children` + Server Action POST de niños (Supabase)

> **Estado:** Aprobado
> **Depende de:** SPEC 08 (tabla `daycares` con 4 registros seed), SPEC 09 (enums `user_role`/`user_status`, tabla `users`, función reutilizable `set_updated_at()`), SPEC 10 (client de servidor `utils/supabase/server.ts` + check de sesión con `getClaims()`)
> **Fecha:** 2026-11-08
> **Objetivo:** Crear las tablas `rooms` y `children` con el enum `child_status` en el proyecto remoto de Supabase siguiendo el patrón de migraciones versionadas, sembrar 3 salas (Soles, Lunas, Estrellas) en Guardería Sala Soles, y exponer en la app Next.js un Server Action POST (`createChild`) que crea niños respetando el esquema de la DB.

## Alcance

**Incluye:**

- Migración `0007_create_rooms.sql` con el DDL de la tabla `rooms`:
  - `id` `uuid` PK, default `gen_random_uuid()`.
  - `daycare_id` `uuid` NOT NULL, FK → `public.daycares(id)`.
  - `name` `text` NOT NULL.
  - `created_at` `timestamptz` NOT NULL, default `now()` (sin `updated_at` — el doc no lo lista).
  - `ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;` (sin policies).
  - Comentarios `COMMENT ON TABLE/COLUMN` en español.
- Migración `0008_seed_rooms.sql` con exactamente 3 salas de prueba (`Soles`, `Lunas`, `Estrellas`), insertadas en la guardería `Guardería Sala Soles` (lookup por nombre en la misma sentencia; los `id` son `gen_random_uuid()`).
- Migración `0009_create_children.sql`:
  - Enum `child_status`: `active`, `archived` + `COMMENT ON TYPE` en español.
  - DDL de la tabla `children`:
    - `id` `uuid` PK, default `gen_random_uuid()`.
    - `room_id` `uuid` NOT NULL, FK → `public.rooms(id)`.
    - `full_name` `text` NOT NULL.
    - `birth_date` `date` NOT NULL.
    - `enrolled_at` `date` NOT NULL.
    - `medical_notes` `text` nullable.
    - `allergy_tags` `text[]` nullable.
    - `photo_consent` `boolean` NOT NULL, default `true`.
    - `status` `public.child_status` NOT NULL (sin default en DB; el POST inserta `'active'` explícito).
    - `created_at` / `updated_at` `timestamptz` NOT NULL, default `now()`.
    - Trigger `before update` con la función `set_updated_at()` ya creada en `0004` (reuso, sin recrearla).
  - `ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;` (sin policies).
  - Comentarios `COMMENT ON TABLE/COLUMN` en español.
- Aplicación de las 3 migraciones al remoto vía Supabase MCP (`apply_migration`), en orden 0007 → 0008 → 0009, con verificación catálogo tras cada aplicación.
- Cliente admin de servicio en `utils/supabase/admin.ts`: `createClient` con `SUPABASE_SERVICE_ROLE_KEY`, `auth: { persistSession: false }` y `import 'server-only'` (el client salta RLS — así funciona el POST mientras `rooms`/`children` siguen sin policies).
- Server Action `createChild(state, formData)` en `actions/children.ts` (patrón de `actions/auth.ts`, SPEC 10):
  - Exige sesión (check con el client de servidor + `getClaims()` de SPEC 10); sin sesión → error, sin insert.
  - Valida contra el perfil del usuario (leído con el admin client): `full_name` no vacío, `birth_date` fecha válida `≤ hoy`, `room_id` uuid existente y **perteneciente a la daycare del staff autenticado**.
  - `enrolled_at`: opcional; si no viene usa la fecha de hoy (default aplicado en la action, no en el DDL).
  - `allergy_tags`: opcional; recibe etiquetas **ya en inglés** (`peanut`, `lactose`, `gluten`…); normaliza recortando espacios, a minúsculas y sin duplicados.
  - `photo_consent`: opcional boolean; default `true`.
  - `medical_notes`: opcional; vacío → `null`.
  - Insert con el admin client: `status = 'active'`, timestamps por default de la DB.
  - Devuelve `{ ok, childId?, error? }` (errores de campo y de sesión/control); no redirige ni muta UI.
- Script de verificación `scripts/verify-0009-children-post.mjs` (ESM, `@supabase/supabase-js` ya instalado): ejecuta con `node --env-file=.env`, realiza el mismo insert que la action vía service role (1 niño de prueba en la sala `Soles`), verifica la fila, y al final **elimina** el niño de prueba dejando `children` en 0 filas.

**No incluye (diferido a otras specs):**

- Conectar el modal "Agregar niño" de SPEC 05 al POST real (hoy sigue en memoria client-side).
- Ver los niños reales en `/kids` (la pantalla sigue con el mock de `lib/kids-data.ts`).
- Leer/borrar/editar niños (GET, PATCH, DELETE) — solo POST.
- Policies de RLS para `rooms` y `children` (quedan RLS on y deniegan todo hasta diseñar el modelo de acceso; la action usa service role, que salta RLS).
- El resto del esquema: `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices` — y **especialmente nada de publicaciones** (decisión explícita del usuario para esta spec).
- Todos los demás enums (`relationship_type`, `invitation_status`, `post_type` — se crean con sus tablas).
- Seed de niños de prueba en DDL (la única fila de prueba la crea y destruye el script de verificación).
- Edición del `references/pantallas/` o de `lib/kids-data.ts`.

## Modelo de datos

Fuente de verdad: `07-DB-Schema/opendaycare-database-schema.md` — §3 `rooms`, §4 `children`, enum `child_status`.

Tablas (`0007_create_rooms.sql` y `0009_create_children.sql`):

```sql
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create type public.child_status as enum ('active', 'archived');

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
```

Seed (`0008_seed_rooms.sql`) — 3 salas en `Guardería Sala Soles`:

```sql
insert into public.rooms (daycare_id, name)
select d.id, s.name
from public.daycares d
cross join (values ('Soles'), ('Lunas'), ('Estrellas')) as s (name)
where d.name = 'Guardería Sala Soles';
```

Trigger de `updated_at` en `children`: `before update` → `set_updated_at()` (creada en `0004`, reutilizable según SPEC 09).

Contrato de la Server Action (`actions/children.ts`, lo que entra al POST y con qué se llama a Supabase):

```ts
type CreateChildResult =
  | { ok: true; childId: string }
  | { ok: false; error: string };

// formData: full_name, birth_date, room_id, enrolled_at?, allergy_tags?, photo_consent?, medical_notes?
export async function createChild(
  state: CreateChildResult | null,
  formData: FormData,
): Promise<CreateChildResult>;
```

Normalización en la action: `allergyTags` → `array lowercase/trim sin duplicados`; `enrolledAt` → `ISO de hoy` si falta; `medicalNotes` → `null` si vacío; `photoConsent` → `true` si falta.

## Plan de implementación

1. Precondición (vía Supabase MCP): confirmar con `list_migrations`, `pg_type` e `information_schema.tables` que **no** existen aún `rooms`, `children`, `child_status` ni migraciones con versiones 0007–0009 en el remoto, y que `set_updated_at()` sigue presente. Confirmar en el repo que `.env` contiene `SUPABASE_SERVICE_ROLE_KEY` (el token no se lee ni se muestra; si falta, parar y consultar al usuario).
2. Crear `supabase/migrations/0007_create_rooms.sql` (create table + enable RLS + comments). Estado: archivo commiteable por sí solo.
3. Aplicar `0007` vía MCP (`apply_migration`, versión `0007`). Verificación: `information_schema.columns` muestra `rooms` con exactamente 4 columnas, FK a `daycares`, RLS en `pg_class` y 0 policies en `pg_policies`.
4. Crear `supabase/migrations/0008_seed_rooms.sql` con el insert de 3 salas. Aplicar `0008` vía MCP. Verificación: `select count(*) from public.rooms where daycare_id = (select id from public.daycares where name = 'Guardería Sala Soles')` devuelve 3, con nombres Soles/Lunas/Estrellas.
5. Crear `supabase/migrations/0009_create_children.sql` (enum `child_status` + tabla + trigger `updated_at` + RLS + comments). Aplicar `0009` vía MCP. Verificación: `pg_type` muestra `child_status` (`active`/`archived`); `information_schema.columns` enumera exactamente las 11 columnas de `children`; FK a `rooms`; RLS on; trigger `before update` presente.
6. Crear `utils/supabase/admin.ts` (client de servicio, `import 'server-only'`). Manual: `npx tsc --noEmit` y `npm run build` pasan.
7. Crear `actions/children.ts` con `createChild(state, formData)` (sesión via client de servidor, validación, insert con admin client). Manual: `npx tsc --noEmit` y `npm run build` pasan; ninguna UI cambia.
8. Crear `scripts/verify-0009-children-post.mjs` que ejecuta el mismo insert del POST (service role), lo verifica en el remoto y elimina el niño de prueba al terminar. Manual: `node --env-file=.env scripts/verify-0009-children-post.mjs` termina OK y deja `children` con 0 filas, `rooms` con 3.
9. Verificación de la spec (spec-verifier): `npm run build`, `npx tsc --noEmit`, `npm run lint`, consultas Context7 si algo de Next.js 16.4.2 o supabase-js lo requiere; consultas MCP de catálogo; script de verificación.

Tras cada migración aplicada el remoto queda consistente; el commit se hace después de cada paso verificado.

## Criterios de aceptación

- [x] `npm run build`, `npx tsc --noEmit` y `npm run lint` pasan sin errores.
  ✅ Verificado (9 nov 2026): `npm run lint` sin errores; `npx tsc --noEmit` sin salida; `npm run build` OK (Next.js 16.4.2, 16/16 páginas, Cache Components + Partial Prefetching activos).
- [x] Existe `supabase/migrations/0007_create_rooms.sql` y su contenido coincide con el modelo de datos de esta spec (4 columnas, FK → `daycares`, RLS, comments).
  ✅ Verificado (9 nov 2026): el archivo contiene `create table public.rooms` con id/daycare_id/name/created_at (default now()), `references public.daycares (id)`, `enable row level security` y `COMMENT ON TABLE/COLUMN` en español — igual al bloque SQL de la spec.
- [x] En el remoto, `rooms` tiene exactamente las 4 columnas del modelo de datos y `pg_class.relrowsecurity = true` con `pg_policies` count = 0.
  ✅ Verificado (9 nov 2026): `information_schema.columns` (execute_sql MCP) lista exactamente 4 columnas (id uuid PK, daycare_id uuid NOT NULL, name text NOT NULL, created_at timestamptz NOT NULL default now()); `pg_class.relrowsecurity = true` para rooms y children; `pg_policies` devuelve 0 filas para ambas tablas.
- [x] En el remoto, `rooms` tiene exactamente 3 filas, todas en la daycare `Guardería Sala Soles`, llamadas `Soles`, `Lunas` y `Estrellas`.
  ✅ Verificado (9 nov 2026): SELECT con JOIN a daycares devuelve 3 filas (Estrellas, Lunas, Soles) todas con `daycare_name = 'Guardería Sala Soles'`.
- [x] En el remoto, `pg_type` muestra `public.child_status` con valores `active`/`archived`.
  ✅ Verificado (9 nov 2026): pg_type/pg_enum devuelve `child_status` con labels `{active,archived}` en schema public.
- [x] Existe `supabase/migrations/0009_create_children.sql` y su contenido coincide con el modelo de datos (11 columnas, FK → `rooms`, trigger `set_updated_at`, RLS, comments).
  ✅ Verificado (9 nov 2026): el archivo contiene `create type public.child_status`, las 11 columnas del bloque SQL de la spec, FK `references public.rooms (id)`, trigger `before update ... execute function public.set_updated_at()` (reuso de 0004, sin recrearla), `enable row level security` y comments en español.
- [x] En el remoto, `children` tiene exactamente 11 columnas y ningún null en `room_id`/`full_name`/`birth_date`/`enrolled_at` es posible (constraints NOT NULL presentes).
  ✅ Verificado (9 nov 2026): `information_schema.columns` lista exactamente 11 columnas con los tipos de la spec; `is_nullable = NO` en room_id, full_name, birth_date y enrolled_at; FK `FOREIGN KEY (room_id) REFERENCES rooms(id)` confirmada en pg_constraint.
- [x] Un UPDATE sobre una fila de `children` refresca `updated_at` automáticamente (trigger `set_updated_at`).
  ✅ Verificado (9 nov 2026): fila temporal de prueba insertada vía execute_sql (updated_at `23:18:46.981`), tras UPDATE devolvió updated_at `23:19:45.068` (trigger `set_children_updated_at` presente en information_schema.triggers, `EXECUTE FUNCTION set_updated_at()`); fila eliminada al terminar (children = 0). El script de verificación también confirma el trigger ("✔ trigger set_updated_at (updated_at cambió)").
- [x] El historial de migraciones del remoto (`list_migrations`) contiene las versiones `0007`, `0008` y `0009`.
  ✅ Verificado (9 nov 2026): `list_migrations` MCP lista `0007_create_rooms`, `0008_seed_rooms` y `0009_create_children` aplicadas al remoto (además de 0001–0006 de specs previas).
- [x] Existe `utils/supabase/admin.ts` con service role client (`persistSession: false`, `server-only`) y no expone la clave en archivos commiteados.
  ✅ Verificado (9 nov 2026): `utils/supabase/admin.ts` tiene `import "server-only"`, `persistSession: false` y lee `SUPABASE_SERVICE_ROLE_KEY`; `git check-ignore .env` confirma que no está trackeado y `git ls-files` no contiene ninguna clave (solo `.env.example` con el placeholder `sb_secret_XXXX…`); patrón avalado por docs Next.js (Data Access Layer con `import 'server-only'`, Query: "How to restrict code to server-only", Context7 /vercel/next.js).
- [x] `actions/children.ts` exporta `createChild(state, formData)`: sin sesión rechaza; con `full_name`/`birth_date`/`room_id` vacíos o inválidos devuelve `ok: false` sin insertar; un `room_id` de otra daycare devuelve error de sala, sin insertar.
  ✅ Verificado (9 nov 2026): revisión de código — check de sesión con `getClaims()` devuelve "{ok:false,error:'Sin sesión activa.'}" sin llegar al insert; validación de `full_name` no vacío, `birth_date` ISO válida ≤ hoy (rechaza desbordes tipo 2026-02-31), `enrolled_at` ISO, `room_id` uuid, sala existente y perteneciente a la daycare del perfil (leído con admin client) antes del insert — todos devuelven `ok:false` con error en español y cortan antes de insertar. Patrón `'use server'` + auth-antes-de-mutar según docs Next.js (Query: Server Actions con 'use server', Context7 /vercel/next.js).
- [x] El POST persiste fiel al esquema: `allergy_tags` en minúsculas inglés sin duplicados, `enrolled_at` = hoy cuando falta, `medical_notes` vacío → `null`, `photo_consent` = `true` cuando falta, `status` = `'active'` siempre.
  ✅ Verificado (9 nov 2026): el script de verificación comprobó sobre la fila persistida: status 'active', enrolled_at = hoy, medical_notes null, allergy_tags ["lactose","peanut"] (de entrada ["Lactose","peanut ","peanut"] — trim/lowercase/dedupe) y photo_consent true; en código, defaults "cuando falta" (enrolled_at → hoy, photo_consent → true, medical_notes vacío → null, tags vacías → null) en actions/children.ts.
- [x] Ejecutar `node --env-file=.env scripts/verify-0009-children-post.mjs` termina OK: crea el niño de prueba, verifica fila (sala `Soles`, nombre, fechas, tags) y lo elimina; al final `children` = 0 filas y `rooms` = 3.
  ✅ Verificado (9 nov 2026): re-ejecutado en esta verificación — 12/12 checks "Resultado: OK" ("Sala Soles OK (daycare: Guardería Sala Soles)… ✔ status/room_id/full_name/birth_date/enrolled_at/medical_notes/allergy_tags/photo_consent… ✔ trigger… ✔ niño de prueba eliminado… ✔ children = 0 (esperado 0)… ✔ rooms = 3 (esperado 3)").
- [x] Ningún archivo de UI cambia: `add-kid-modal.tsx`, `kids-screen.tsx`, `lib/kids-data.ts` y `/kids` siguen exactamente como SPEC 05 los dejó.
  ✅ Verificado (9 nov 2026): `git status --porcelain` solo muestra `.env.example`, `package.json`, `package-lock.json` (modificados — server-only instalado y doc de variable) y los archivos nuevos de esta spec (migraciones 0007–0009, `utils/supabase/admin.ts`, `actions/children.ts`, `scripts/`); ningún archivo de UI aparece modificado.

## Decisiones

- **Sí:** una sola spec para tablas + POST (decisión del usuario). El entregable principal es la base de datos, así que vive en `specs/database/` con un paso de app.
- **No:** separar en dos specs (tablas / endpoint). El POST es inseparable del esquema que crea las tablas; partirla duplicaría la documentación del modelo.
- **Sí:** 3 salas solo en `Guardería Sala Soles` (decisión del usuario). Es la daycare del usuario staff real y los nombres Soles/Lunas/Estrellas coinciden con el selector del modal de SPEC 05.
- **No:** sembrar 3 salas por cada una de las 4 daycares (12 filas). Son datos de prueba; sembrar salas que ninguna app usa hoy ensucia el remoto sin valor.
- **Sí:** Server Action (decisión del usuario) vs Route Handler `/api/children`. Patrón ya establecido en `actions/auth.ts` (SPEC 10), corre solo en servidor y no expone un endpoint HTTP público sin policy.
- **Sí:** service role en servidor para el insert (decisión del usuario). `rooms`/`children` quedan RLS on sin policies (patrón del proyecto); el admin client salta RLS y el POST funciona hoy sin decidir el modelo de acceso por rol.
- **No:** policies de RLS para staff en esta spec. Diseñarlas exige decidir autorización por rol (difirida desde SPEC 09/10); abrirlas ahora sería improvisar el modelo de acceso.
- **Sí:** tags de alergia ya en inglés al llegar al POST (decisión del usuario). La traducción español → inglés es asunto de la capa UI cuando se conecte el modal.
- **Sí:** `enrolled_at` opcional con default HOY (decisión del usuario). El doc no le pone default en DB, así que el DDL lo lleva NOT NULL sin default y el default lo aplica la action.
- **No:** `UNIQUE (daycare_id, name)` en `rooms`. El doc no lo define y el objetivo es respetar el esquema tal cual; el anti-duplicado queda como preocupación de negocio para otra iteración.
- **No:** default en DB para `status` de `children`. El doc no lo especifica; el POST inserta `'active'` explícito y el borrado lógico (`archived`) fue pensado con valor controlado por la app.
- **Sí:** sí valida que `birth_date` sea fecha válida `≤ hoy`. Un niño con fecha de nacimiento futura es corrupción de datos en una guardería.
- **Sí:** reutilizar `set_updated_at()` de `0004` sin recrearla. Es la función "reutilizable por tablas futuras" que SPEC 09 dejó precisamente para esto.
- **No:** seed de niños en DDL. El POST es la vía de creación por diseño; la única fila de prueba la crea y destruye el script de verificación (deja la DB limpia y el script es idempotente).
- **Sí:** la clave vive en `.env` del repo (decisión del usuario, registrada en implementación) en vez de `.env.local`. Verificado que `.env` no está trackeado por Git (solo `.env.example` lo está) y el historial nunca lo tocó; el riesgo de fuga por commit queda descartado.
- **Sí:** script ESM con `node --env-file=.env` y `@supabase/supabase-js` ya instalado vs añadir `tsx`/`dotenv`. Es la vía sin dependencia nueva para probar servidor-a-remoto con service role.
- **Sí:** `createChild` exige sesión activa aunque el insert salte RLS. Server Actions son endpoints invocables; el check con `getClaims()` evita que cualquiera sin sesión dispare inserts.
- **No:** conectar el modal de SPEC 05 ni leer niños para `/kids`. El usuario lo explicitó: solo el método POST (crear) por ahora.
- **No:** cualquier tabla de publicaciones (`posts`, `post_children`, `post_photos`, `reactions`, `comments`). Explícitamente fuera de esta spec (otra spec).

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` no está en `.env`                                                 | Precondición del paso 1: constatar su existencia antes de escribir código; si falta, parar y pedir al usuario que la traiga del dashboard (nunca se commitea ni se imprime).           |
| El admin client queda importable por accidente desde el browser                              | `import 'server-only'` en `utils/supabase/admin.ts` lo impedirá al compilar (a nivel de bundler) y fuerza `persistSession: false`.                                                     |
| Re-ejecutar el script de verificación deja niños huérfanos de pruebas previas                | El script crea y luego borra su propia fila; idempotente por diseño y termina en `children` = 0 filas.                                                                                 |
| El lookup `where name = 'Guardería Sala Soles'` del seed coincide con varias filas           | La migración `0002` la sembró una sola vez (SPEC 08 la verifica única); si apareciera duplicada la precondición del paso 1 detectaría fila duplicada × 3 y se revisa antes de aplicar. |
| La Server Action se manda llamar desde el cliente de SPEC 05 mientras sigue client-side      | No conectar es la decisión registrada en Alcance/Decisiones; el modal no cambia y el POST solo es invocable desde servidor.                                                            |
| Las policies de `daycares` (0006, post-SPEC 10) interfieren con el seed o las verificaciones | No lo hacen: esas policies solo cubren `users` y `daycares`; el seed y las verificaciones de `rooms`/`children` usan catálogo/MCP admin, nunca sesiones de usuario.                    |

## Qué **no** está en esta spec

- Conectar el modal "Agregar niño" (SPEC 05) al POST.
- Leer lista real de niños en `/kids` (se mantiene el mock).
- GET/UPDATE/DELETE de niños.
- Policies de RLS para `rooms` y `children`.
- Tablas de publicaciones y todo lo demás del esquema (`parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`).
- Seed de niños desde el DDL.

Cada uno de esos, si aterriza, va en su propia spec.
