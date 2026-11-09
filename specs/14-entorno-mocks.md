# SPEC 14 — Entorno de mocks: `npm run dev:mock` para `/kids` sin DB real

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (modal "Agregar niño" client-side y lista con estado client), SPEC 12 (lista `/kids` real + admin client), SPEC 13 (perfil dinámico real + spinner), SPEC 11 (tablas y admin client)
> **Fecha:** 2026-11-09
> **Objetivo:** Añadir un entorno de mocks reproducible con `npm run dev:mock` que aísla todo el módulo `/kids` (lista, modal y perfiles) de la base de datos usando los datos mock existentes, mientras `npm run dev` sigue leyendo/escriviendo contra la DB real como en las SPEC 12/13.

## Alcance

**Incluye:**

- **Archivo `.env.mock` (NUEVO, commiteado):** una única línea no sensible, `DAYCARE_DEV_MODE=mock`.
- **Script npm** (package.json):
  - `"dev:mock": "node --env-file-if-exists=.env.mock node_modules/next/dist/bin/next dev --turbopack"` — carga la var del archivo para el proceso del servidor (Node ≥ 22 disponible: v26.12.1).
  - `"dev"` queda **intacto** (`next dev --turbopack`): modo real por defecto.
- **Helper del flag** (`lib/dev-environment.ts` NUEVO): `isMockEnv(): boolean` → `process.env.NODE_ENV === "development" && process.env.DAYCARE_DEV_MODE === "mock"`. Se consume SOLO en páginas server (nunca necesita client; el modo viaja como prop).
- **`/kids` en modo mocks** (`app/(app)/kids/page.tsx`):
  - `isMockEnv()` → render directo con los 8 mock de `lib/kids-data.ts` (sin lecturas de DB, sin Suspense necesario en el tramo de datos, sin toast de fallo — no hay conexión que falle).
  - `kids-screen` recibe el modo como prop (`mockMode`) y cambia exactamente tres cosas vs modo real:
    1. lista = mock + niños agregados en la sesión (estado client, SPEC 05),
    2. modal guarda **client-side** (spec 05): `createKidFromForm(draft, nextId)` con `nextId = max + 1` de los ids actuales, antepone en la lista y muestra el mismo **toast de éxito** "El niño/a {Nombre} agregado a la sala {Sala}" (decisión del usuario),
    3. tarjetas navegables (`navigable=true`): perfiles mock 1–8 resuelven la pantalla de perfil con sus datos de ejemplo (decisión del usuario).
  - Validación inline y visual del modal: idéntica (SPEC 05/12).
  - `?fail=1` **no tiene efecto** en modo mocks (decisión del usuario). En modo real, `?fail=1` sigue funcionando exactamente como SPEC 12/13 (regresión cubierta por criterios).
- **Perfil en modo mocks** (`app/(app)/kids/[id]/page.tsx`):
  - `isMockEnv()` → resolver numérico: id entero 1–8 presente en el mock → **pantalla de perfil mock** (Hero con datos de ejemplo, banner de alergias del mock, InfoList, bloque Padres con sus filas de ejemplo + botón "Vincular otro padre" siempre disponible, Editar/Resumen inertes).
  - uuid (o cualquier id que no sea un mock existente) → `notFound()` default.
  - El modo real sigue siendo el de SPEC 13 (uuid → DB; resto → notFound; `?fail=1` → error in-page).
- **Garantía de producción:** el flag solo actúa con `NODE_ENV=development` — `next build` y `next start` (producción) **siempre** leen la DB real aunque la variable estuviera seteada (decisión del usuario).

**No incluye (diferido a otras specs):**

- Mocks de otras pantallas (home/feed ya es client-mock y no lee DB — sin cambios).
- Login/sesión mock: en `dev:mock` el shell sigue autenticando contra Supabase Auth con el usuario staff seed (decisión: híbrido shell-real/datos-mock; el sidebar muestra el perfil real del usuario).
- Datos mock nuevos: se reutilizan los 8 de `lib/kids-data.ts` (sin seed adicional).
- La base de datos NO cambia (sin migraciones); `actions/children.ts` y `utils/supabase/admin.ts` quedan intactos.

## Modelo de datos

**La DB no cambia y no se añade data nueva.** Único cambio de "estado" visible:

```
.env.mock  →  DAYCARE_DEV_MODE=mock   (commiteado; nunca contendrá secretos)
```

El flag se evalúa en el servidor por página; el client recibe el modo como prop (`mockMode`) — ninguna lectura de `process.env` llega al bundle del browser.

## Plan de implementación

1. **Infra del flag:** crear `.env.mock`, script `dev:mock` en `package.json` y `lib/dev-environment.ts` (`isMockEnv()`). Manual: `npm run dev:mock` arranca (dev server propio, mismo puerto 3000 cuando está libre); `npm run dev` sin cambios; `npx tsc --noEmit` + `npm run lint` OK.
2. **Lista mock:** bifurcación en `app/(app)/kids/page.tsx` (mock → render con mockKids + rooms mock + `mockMode`), prop `mockMode` en `kids-screen` (handleSaveKid client-side de SPEC 05 + toast idéntico + `navigable` real/mock), y `add-kid-modal` dual-mode (prop `mockMode`: `onSave(draft)` vs `createChild(null, formData)` — el POST sólo corre con pantalla server y salas real). Manual: `dev:mock` → lista con 8; agregar un niño lo antepone con toast; MCP confirma `count(children)` sin cambio; recargar vuelve a 8.
3. **Perfil mock:** bifurcación en `[id]/page.tsx` (mock → resolver numérico getKidById; resto → notFound; el flag no toca el camino real). Manual: `dev:mock` → `/kids/2` perfil de Sofía con sus padres de ejemplo; `/kids/{uuid}` → 404; y en modo real todo sigue como SPEC 13.
4. **Verificación de la spec (spec-verifier):** `npm run build`, `npx tsc --noEmit`, `npm run lint`; E2E Playwright **dos sesiones**: (a) `npm run dev:mock` → lista 8, modal guarda client-side con toast literal y sin insert (MCP), perfiles 1–8 navegables con datos de ejemplo, uuid → 404, `?fail=1` sin efecto, consola 0/0; (b) `npm run dev` (real) sin regresión: lista DB con Nina, perfil de uuid real, `?fail=1` activo como SPEC 12/13. Capturas en `.playwright-mcp/`.

Tras cada paso el proyecto queda compilable y funcional; el commit se hace después de cada paso verificado (por el usuario).

## Criterios de aceptación

- [ ] `npm run build`, `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [ ] Existe `.env.mock` commiteado con exactamente `DAYCARE_DEV_MODE=mock` (sin secretos) y `package.json` tiene `dev:mock` (`node --env-file-if-exists=.env.mock …`); el script `dev` queda sin cambios.
- [ ] Con `npm run dev:mock`: `/kids` muestra los 8 mock sin spinner de DB y **sin toast de fallo de conexión**; consola 0/0.
- [ ] Con `npm run dev:mock`: el modal valida inline igual y al guardar antepone al niño (SPEC 05: `createKidFromForm`) con toast "El niño/a {Nombre} agregado a la sala {Sala}"; MCP confirma que `count(children)` en el remoto NO cambia.
- [ ] Con `npm run dev:mock`: `/kids/1` a `/kids/8` muestran los perfiles mock con datos de ejemplo (hero, banner de alergias del mock, padres de ejemplo, botón "Vincular otro padre" SIEMPRE disponible, Editar/Resumen inertes).
- [ ] Con `npm run dev:mock`: un uuid en la ruta da `notFound()` default.
- [ ] Con `npm run dev:mock`: `?fail=1` no produce ningún efecto (ni toast de fallo ni datos alterados).
- [ ] Con `npm run dev` (real): sin regresión — lista lee la DB (Nina), tarjetas uuid navegables, perfil real, `?fail=1` activo (SPEC 12/13), modal guarda vía `createChild` con POST real.
- [ ] El flag no tiene efecto en producción: con `NODE_ENV=production` (`next build`/`next start`) la app siempre usa el camino real aunque la variable esté seteada (criterio verifica código + una request tras build regular).
- [ ] Ningún archivo de DB cambia (sin migraciones); `utils/supabase/admin.ts` y `actions/children.ts` quedan intactos (el dual-mode del modal agrega el client-path; el POST real no cambia).

## Decisiones

- **Sí:** archivo `.env.mock` + `node --env-file-if-exists` (decisión del usuario). Cross-platform, sin estado mutable en el repo, y Next no auto-carga `.env.mock` (solo `.env`/`.env.local`/fases conocidas), así no hay colisiones con el env real.
- **No:** JSON de config reescrito por el script (idea original del usuario, descartada conjuntamente): es estado mutable en el repo y dos servidores paralelos se pisarían.
- **No:** `set DAYCARE_DEV_MODE=mock&&` inline: solo Windows (cmd), rompe en cualquier shell POSIX/CI.
- **Sí:** en `dev:mock` guardar el modal es client-side (SPEC 05 restaurada). Es la esencia de un entorno sin backend: la persistencia llega con el modo real.
- **Sí:** mismo toast de éxito en mock (decisión del usuario) para UX idéntica entre entornos.
- **Sí:** perfiles mock 1–8 navegables y uuid → 404 (decisión del usuario): en mocks el único espacio de ids existente es el numérico del mock.
- **Sí:** flag dev-only (decisión del usuario). Los builds/starts de producción siempre DB real — sin manera de filtrar el modo mock a un deploy por error de ambiente.
- **Sí:** `?fail=1` sin efecto en mock (decisión del usuario) y activo en real (sin regresión: SPEC 12/13 quedan intactas).
- **Sí:** login/session sigue real en dev:mock. Mockear Auth también complicaría el shell y el sidebar; el alcance del entorno es el módulo /kids, y el flujo de sesión ya está cubierto por SPEC 10.
- **Sí:** sin datos mock nuevos — reutilización de `lib/kids-data.ts` tal cual.

## Riesgos

| Riesgo                                                                       | Mitigación                                                                                                                             |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `node --env-file-if-exists` exige Node ≥ 22                                  | Repo en Node v26.12.1 (verificado); el requisito queda documentado en la spec y el script crashea con error claro si Node abajo de 22. |
| Un `.env.mock` mutable en el futuro llegue a contener secretos y se comitee  | El archivo queda commiteado con 1 flag inofensivo; criterios revisan contenido; cualquier var secreta NO pertenece ahí (documentado).  |
| Dev real y dev:mock simultáneos chocan por el puerto 3000                    | Una instancia a la vez; Next avisa "port in use" y se alternan los servidores — documentado como flujo esperado.                       |
| El dual-mode del modal duplica lógica de guardado y se diverge con el tiempo | El modo viaja como prop; reutilizar validación inline y estilos comunes; el POST real sigue siendo 1 solo código path.                 |
| Otra pantalla lea `process.env.DAYCARE_DEV_MODE` directo                     | Helper único `isMockEnv()` en `lib/dev-environment.ts`; el client nunca lee la var (prop `mockMode`).                                  |
| Builds con cacheComponents: env var leída en render                          | Sólo en páginas server (request-time constante del proceso); en `next build` NODE_ENV=production fuerza el camino real determinista.   |

## Qué **no** está en esta spec

- Mock de login/Auth/sidebar.
- Datos mock nuevos o seeds adicionales.
- Otros módulos (feed, publicaciones, avisos) — ya operan client-mock sin DB.
- Cambios de DB (sin migrations), policies RLS o cambios en `admin.ts`/`actions/children.ts`.

Cada uno de esos, si aterriza, va en su propia spec.
