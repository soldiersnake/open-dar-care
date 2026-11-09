# SPEC 13 — Perfil real de niño `/kids/[uuid]` conectado a la DB

> **Estado:** Implementado
> **Depende de:** SPEC 02 (pantalla de perfil mock con Hero/Banner/InfoList/Resumen/Padres), SPEC 06 (bloque "Padres vinculados" + modal VINCULAR client-mock), SPEC 11 (tablas `children`/`rooms` + admin client + `createChild`), SPEC 12 (patrón server-read de `/kids` con Suspense + `?fail=1` dev-only)
> **Fecha:** 2026-11-09
> **Objetivo:** Hacer navegable el perfil de los niños reales: la tarjeta de un niño de la DB abre `/kids/[uuid]` con sus datos reales (hero, banner de alergias + notas, fechas), los uuid inexistentes acaban en `notFound()`, y el fallo de conexión muestra un estado de error in-page; los mocks 1–8 dejan de ser navegables en modo real y esperan al entorno de mocks (SPEC 14).

## Alcance

**Incluye:**

- **Tarjetas de DB navegables** (`components/kids/kid-card.tsx` / `kid-list.tsx`):
  - Un niño de la tabla `children` (uuid) es una tarjeta con `<Link>` a `/kids/{uuid}` — se elimina la limitación "no navegan" de SPEC 12.
  - En modo real con `?fail=1` (fallback al mock), las tarjetas mock se muestran `interactive={false}` (sin navegación) — los perfiles mock 1–8 dejan de existir en modo real y el entorno de mocks llegará con SPEC 14. `kid-list.tsx` pasa a recibir la navegabilidad desde `kids-screen.tsx` (real → navegables, fallback → no navegables).
- **Perfil dinámico** (`app/(app)/kids/[id]/page.tsx` REESCRITO):
  - Se elimina `generateStaticParams` de los mocks: toda la ruta funciona por request (bajo el layout `(app)`, con `instant = false` ya heredado).
  - Resolución: si el `id` es un uuid y existe en `public.children` (join `rooms(name)`) → **perfil real**; cualquier otro id (mocks numéricos 1–8 incluidos, uuid inexistente, formato inválido) → `notFound()` default.
  - Lectura con el admin client (rooms/children siguen sin policies — SPEC 11) dentro de `<Suspense>` siguiendo el patrón de SPEC 12.
  - Estado de error in-page: si la lectura falla (`try/catch`, reproducible con `?fail=1` en dev), caja centrada "Perfil no disponible" + botón "Volver a Niños" (regreso a `/kids`); NO es un crash ni redirect.
  - Datos renderizados (reusa los componentes del mock, alimentados desde la DB):
    - `Hero`: avatar con iniciales/color (paleta por índice de fila), nombre, edad derivada de `birth_date`, "Sala {room name}".
    - Banner "Alergias y notas" (decisión del usuario: etiquetas + notas juntas): primera línea con las etiquetas traducidas en inglés→español (mismo mapping de SPEC 12, ej. "Alergia a maní, lactosa."); si hay `medical_notes` se muestran como segunda línea dentro del mismo banner; sin tags ni notas → no se muestra el banner.
    - `InfoList`: Fecha de nacimiento (formato mock "12 mar 2022"), Sala, Ingreso (formato mock "nov 2026").
    - Botón "Editar" y botón "Resumen del día": siguen inertes (`href="#"`) — cada uno su propia spec futura.
- **Bloque "Padres vinculados"** (decisión del usuario, sin cambios de código): El `LinkParentCard` de SPEC 06 se conserva tal cual — mock client-side — y el botón "Vincular otro padre" debe seguir disponible SIEMPRE (con o sin padres asignados; `parent_children` aún no existe así que los niños reales aparecen sin padres). El vínculo real de padres será otra spec.

**No incluye (diferido a otras specs):**

- Entorno `npm run dev:mock` (SPEC 14, ya definida con el usuario: flag + scripts + lista y perfil desde mocks).
- Botón real "Vincular padre" (creación de `parent_children`/`invitations`; en niños reales el modal sigue client-side y no persiste).
- Editar niño (nuevo modal) — spec futura.
- Resumen del día real (tabla `daily_summaries` no existe aún).
- Policies de RLS / session client.
- La base de datos NO cambia (sin migraciones); `actions/children.ts` y `utils/supabase/admin.ts` quedan intactos (solo se consume).

## Modelo de datos

**La DB no cambia.** La app consume la fila por `id` y deriva presentación del lado server (mismo patrón SPEC 12):

```ts
// Lectura del perfil (server, admin client)
// select one row por id + nombre de sala:
profileRow = {
  id: string;          // uuid, PK de children
  full_name: string;
  birth_date: string;  // ISO date
  enrolled_at: string; // ISO date
  allergy_tags: string[] | null;
  medical_notes: string | null;
  rooms: { name: string };  // join 1:1 (child → room)
};

// Presentación derivada (server-side, reutilizando helpers de SPEC 12):
type KidProfile = {
  kid: Kid;            // shape existente de lib/kids-data.ts (id uuid, fechas formateadas, tags traducidas)
  medicalNotes: string | null; // para la segunda línea del banner
};
```

El resolver decide modo REAL (uuid en DB) vs `notFound()` vs estado de error (fallo de lectura); ya no existe la rama mock del perfil.

## Plan de implementación

1. **`kid-list.tsx` navegabilidad explícita:** `KidList` recibe `navigable?: boolean` (default respeta comportamiento previo vía mock check); `kids-screen.tsx` lo pasa: real → `navigable` (tarjetas DB con `<Link>`), `?fail=1` → `false` (tarjetas mock informativas). `kid-card.tsx` no necesita cambios (el `<Link>` con uuid ya funciona con `interactive=true`). Manual: `npx tsc --noEmit` + build; `/kids` real navega a `/kids/{uuid}`.
2. **Perfil dinámico real:** reescribir `app/(app)/kids/[id]/page.tsx`: resolver (uuid válido → loader del admin client; resta → `notFound()`), `<Suspense>` con spinner reutilizado (`KidsLoading` con label "Cargando niño…" vía prop `label` OPCIONAL — decide en implementación si conviene un componente mínimo aparte), try/catch → estado "Perfil no disponible" + volver, y el render con Hero/Banner/InfoList alimentados por `kidFromDbRow` + `medical_notes` (segunda línea del banner). Quitar `generateStaticParams` de mocks. Manual: build OK; click en la tarjeta de Nina (dev) abre el perfil real.
3. **Signatura del banner:** segunda línea con `medical_notes` + sin banner cuando no hay datos de ninguno de los dos. Manual: insertar un niño de prueba con `medical_notes` + tags via MCP → banner muestra ambas; uno con solo `medical_notes` → banner solo notas; uno limpio (Nina) → sin banner. Eliminar los de prueba al terminar.
4. **Borrado de la ruta mock:** los mocks 1–8 en modo real responden 404 (verificar `/kids/1` → not-found default) y en `?fail=1` las tarjetas mock no navegan (cursor default).
5. **Verificación de la spec (spec-verifier):** `npm run build`, `npx tsc --noEmit`, `npm run lint`; E2E Playwright 1280/375 con login (`staff@opendaycare.test` / `DayCare2026!`): navegación lista→perfil uuid, banners por caso (tags+notas / solo notas / sin banner), InfoList con fechas correctas, padres: bloque con botón "Vincular otro padre" disponible (y modal mock SPEC 06 operativo client-side), Editar/Resumen inertes, `?fail=1` → error in-page (no crash), uuid inventado → not-found default, `/kids/1` → not-found (modo real), consola 0/0, paridad visual vs `perfil-nino.dc.html` (capturas en `.playwright-mcp/`). Fila de test de banner se crea y se elimina via MCP (se deja el estado dev del usuario: solo Nina).

Tras cada paso el proyecto queda compilable y funcional; el commit se hace después de cada paso verificado (por el usuario).

## Criterios de aceptación

- [x] `npm run build`, `npx tsc --noEmit` y `npm run lint` pasan sin errores.
      ✅ Verificado (9 nov 2026): lint exit 0, tsc exit 0, `next build` exit 0 (dos pasadas: antes y después del fix del `?fail=1`), `/kids/[id]` en ◐ Partial Prerender con `cacheComponents`.
- [x] Desde `/kids` (modo real), la tarjeta de un niño real (uuid) tiene `<Link>` y navega a `/kids/{uuid}`: cursor link + hover de la tarjeta como las mock.
      ✅ Verificado (9 nov 2026): snapshot muestra la tarjeta de Nina como `link` con `href=/kids/dbf3c931-…` y `cursor=pointer`; hover capturado (`.playwright-mcp/spec13-kids-hover-nina.png`); el click navegó a `/kids/{uuid}` (URL confirmada).
- [x] `/kids/{uuid}` de un niño real muestra el perfil con datos reales: Hero (iniciales derivadas del nombre, edad desde `birth_date`, "Sala {nombre real de la sala}"), InfoList con Fecha de nacimiento / Sala / Ingreso en formato mock (`12 mar 2022` / `nov 2026`).
      ✅ Verificado (9 nov 2026): perfil de Nina renderiza Hero "Nina Gómez / 4 años · Sala Soles" e InfoList "12 mar 2022 / Soles / nov 2026"; capturas `.playwright-mcp/spec13-perfil-nina-1280.png` y `spec13-perfil-nina-375.png`.
- [x] Banner "Alergias y notas" con niño con tags (`[peanut,lactose]`) → primera línea "Alergia a maní, lactosa."; con `medical_notes` además → segunda línea con el texto de notas; niño sin tags ni notas → no hay banner.
      ✅ Verificado (9 nov 2026): Nina (tags `[peanut,lactose]`) → "Alergia a maní, lactosa."; niño de prueba tags `[peanut]` + `medical_notes` → línea 1 "Alergia a maní." + línea 2 "Lleva inhalador en la mochila." sin desborde (`spec13-perfil-banner-tags-notas-1280.png`); niño solo `medical_notes` → "Intolerancia a la lactosa." (`spec13-perfil-banner-solo-notas-1280.png`); niño limpio → sin banner (`spec13-perfil-sin-banner-1280.png`). Filas de prueba eliminadas vía MCP (children quedó solo con Nina).
- [x] Bloque "PADRES VINCULADOS" en el perfil real: aparece vacío (sin filas) y el botón "Vincular otro padre" es clicable SIEMPRE (con y sin padres), abre el modal de SPEC 06 funcional client-side (agrega fila pending en memoria, sin persistir).
      ✅ Verificado (9 nov 2026): bloque vacío + botón visible en el perfil de Nina; modal SPEC 06 abre con código de invitación; guardar agrega fila "PENDIENTE" en memoria (`spec13-perfil-modal-pendiente-1280.png`); tras recargar el bloque vuelve vacío y `to_regclass('public.parent_children')` = null (sin persistencia).
- [x] "Editar" y "Resumen del día" quedan sin acción (no navegan, ni rompen con click: cualquier interacción es no-op registrada como decisión de spec).
      ✅ Verificado (9 nov 2026): clicks en ambos (`href="#"`) → URL permanece `/kids/dbf3c931-…` con solo el hash `#`, sin navegación ni errores de consola.
- [x] Un uuid que NO existe responde `notFound()` con la página default del app.
      ✅ Verificado (9 nov 2026): `/kids/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee` → "404 · This page could not be found." (default de Next bajo el layout `(app)`).
- [x] Un id numérico (1–8, los antiguos mock) en modo real responde también not-found (generateStaticParams de mocks eliminado; la ruta ya no depende de IDs estáticos).
      ✅ Verificado (9 nov 2026): `/kids/1` → 404 default; en el build no hay `generateStaticParams` para `/kids/[id]` (ruta ◐ por request).
- [x] Con `?fail=1` (dev) abriendo el perfil de un uuid: se ve (tras el spinner) la caja centrada "Perfil no disponible" con botón "Volver a Niños" que regresa a `/kids`; sin crash ni redirect automático.
      ✅ Verificado (9 nov 2026): spinner "Cargando niño…" → caja "Perfil no disponible" (`spec13-perfil-fail-error-1280.png`); el botón "Volver a Niños" regresa a `/kids`. Fix aplicado durante la verificación: `readFailed` inicializaba en `false` y con `?fail=1` terminaba en `notFound()` 404 en vez de la caja; ahora `readFailed = forcedFailure`.
- [x] En `/kids` con `?fail=1`, las tarjetas del mock quedan NO navegables (cursor default); las navegaciones de fallback a 404 desaparecen.
      ✅ Verificado (9 nov 2026): 8 mock informativos sin `<Link>`, cursor computed `default`, click en tarjeta → URL sigue `/kids?fail=1` (`spec13-kids-fail-1280.png`), toast "Fallo de conexión al cargar los niños.".
- [x] Ningún archivo de DB cambia (sin migraciones); `utils/supabase/admin.ts` y `actions/children.ts` quedan intactos.
      ✅ Verificado (9 nov 2026): `git status`/`git diff --stat` solo muestra los 4 archivos de la spec; sin archivos de migración; `admin.ts` y `children.ts` sin diff. DB verificada vía MCP antes/después: `children` quedó solo con Nina (`dbf3c931-…`, tags `[peanut,lactose]`, notes null) y `parent_children` no existe.
- [x] Consola 0 errores / 0 warnings en las páginas verificadas (1280px y 375px) y build OK con `cacheComponents`.
      ✅ Verificado (9 nov 2026): Playwright console messages = 0 errores / 0 warnings acumulados en `/kids`, `/kids/{uuid}`, `/kids/{uuid}?fail=1`, `/kids?fail=1`, 404s, modal, 1280px y 375px; build OK con `Cache Components enabled`.

## Decisiones

- **Sí:** perfil por request sin `generateStaticParams` de mocks (decisión implícita en la respuesta 1 del usuario: modo real = solo DB). Elimina la bifurcación uuid-mock del perfil; mocks solo en el entorno de mocks (SPEC 14).
- **No:** híbrido de perfiles (uuid real + mock 1–8 en simultáneo en modo real). La alternativa con entorno de mocks separado (SPEC 14) lo reemplaza, y con menos ambigüedad: dos fuentes de verdad nunca coexisten en modo real.
- **Sí:** tarjetas mock NO navegables en `?fail=1` mientras no exista SPEC 14. Sin esto, el fallback llevaría a un 404 (mala experiencia que SPEC 05 ya descartó).
- **Sí:** banner etiquetas + notas juntas (decisión del usuario). Una sola pieza de feedback visual con ambas fuentes legibles.
- **Sí:** estado de error in-page con "Volver a Niños" (decisión del usuario) para fallos de lectura del perfil; sin crash ni mock arbitrario.
- **Sí:** botón "Vincular otro padre" SIEMPRE disponible (decisión del usuario: los padres pueden llegar después). Sin cambios de código: el componente de SPEC 06 ya lo hace.
- **Sí:** modal VINCULAR sigue mock client-side (sin persistir) hasta la spec de `parent_children`/`invitations`.
- **Sí:** "Editar" y "Resumen del día" inertes (decisión del usuario): cada uno merece spec propia (la edición necesita su propio flujo/modal validado; el resumen depende de una tabla que aún no existe).
- **No:** custom 404 de marca. `notFound()` default es suficiente y estándar de Next (decisión del usuario).
- **Sí:** spinner del Suspense reusando `KidsLoading` (con `label` si aplica) — estados ya acordados en SPEC 12.

## Riesgos

| Riesgo                                                                                             | Mitigación                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La eliminación de `generateStaticParams` deja la ruta `/kids/[id]` 100% dinámica (cacheComponents) | Aceptado: la sesión ya es dinámica en este árbol; el SSR por request resuelve el uuid una vez por visita y `instant = false` en el layout exime del shell estático. |
| `?fail=1` acaba en navegables falsas si `kid-list` se reescribe mal                                | Prop `navigable` explícita desde `kids-screen` (criterio de aceptación dedicado a este caso).                                                                       |
| Char del banner con tags y notas: desbordes de líneas con textos largos                            | Estilo del banner ya probado en SPEC 02; segunda línea con `whitespace-normal` y comprobado en el E2E.                                                              |
| El modal VINCULAR client-mock confunde al usuario (fila pending no persiste)                       | Decisión registrada: persistencia de parents realmente en la spec de `parent_children`; la VISUAL del badge "PENDIENTE" ya lo indica (SPEC 06).                     |
| Edad de Nina (fila dev) depende de `new Date()` (fecha absoluta que cambia día a día)              | Derivaciones server-side; los criterios de aceptación usan derivaciones relativas (fecha explícita → edad esperada en el momento_checks).                           |

## Qué **no** está en esta spec

- Entorno `npm run dev:mock` (SPEC 14).
- Vincular padre real (`parent_children`/`invitations`).
- Editar niño, resumen del día real.
- Policies de RLS y session client.
- Cualquier cambio de esquema/migraciones.

Cada uno de esos, si aterriza, va en su propia spec.
