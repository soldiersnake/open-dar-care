# SPEC 12 — `/kids` conectada a la DB: agregar niño (POST real) + lista real

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (modal "Agregar niño" y pantalla `/kids` implementadas), SPEC 10 (arquitectura de sesión: layout `(app)` con `getCurrentUserProfile` + proxy), SPEC 11 (Server Action `createChild` + tablas `rooms`/`children` + admin client)
> **Fecha:** 2026-11-09
> **Objetivo:** Conectar `/kids` a la base real: el modal "Agregar niño" guarda vía `createChild` en Supabase con feedback de toast, y la lista principal lee los niños de la tabla `children` con spinner de carga, estado vacío y fallback al mock si falla la conexión.

## Alcance

**Incluye:**

- **Refactor del toast** (sin cambio visual ni de API): la lógica del `Toast` existente (`components/shared/toast.tsx`, variantes `success`/`error`/`warning`, auto-cierre 3s) se extrae a un `ToastProvider`/`ToastContext` genérico en el NUEVO archivo `components/shared/toast-provider.tsx`, con hook `useToast()` → `showToast(message, variant?)`.
  - `NewPostProvider` mantiene su API (`newPosts`, `addPost`, `showToast`) pero delega `showToast` al `ToastProvider`; el feed no cambia en nada.
  - El layout `app/(app)/layout.tsx` sigue montando `NewPostProvider` (que internamente monta `ToastProvider`), así `/kids` consume `useToast()` directamente.
- **Lectura real en el servidor** (`app/(app)/kids/page.tsx`): lee del remoto con el admin client (porque `rooms`/`children` aún no tienen policies — SPEC 11):
  - `rooms`: `id` + `name` (las 3 salas seed).
  - `children`: filas reales con el nombre de sala resuelto (join): `id`, `full_name`, `birth_date`, `enrolled_at`, `allergy_tags`, `medical_notes`, `photo_consent`, `status`, `room name`.
  - La lectura va dentro de una boundary `<Suspense>` cuyo fallback es el **spinner simple** (`components/kids/kids-loading.tsx` NUEVO): círculo animado CSS con la paleta del app + texto "Cargando niños…" en el área del grid.
  - try/catch: si la lectura de DB falla, el server renderiza con los datos del **mock** (`lib/kids-data.ts`) + flag `connectionLost` (el client dispara el toast de fallo on-mount).
  - Modo de prueba dev-only: con `NODE_ENV=development`, el query param `?fail=1` fuerza el camino de fallo (fallback al mock) para verificar la degradación de forma reproducible.
  - `/kids` pasa de estática (○) a dinámica (ƒ) por leer DB (riesgo registrado).
- **`components/kids/kids-screen.tsx`** (MODIFICADO, client):
  - Recibe del server la carga resultante: niños reales, opciones de sala (id+name) y flag `connectionLost`.
  - `connectionLost = true` → `showToast("Fallo de conexión al cargar los niños.", "error")` on-mount y la lista muestra el mock de 8.
  - `children.length === 0` → **estado vacío**: caja centrada "No hay niños agregados" + subtexto "Usa el botón '+ Agregar niño' para crear el primero".
  - Con datos → grid normal con los filtros de SPEC 02 (búsqueda por nombre, separadores por sala) sobre las filas de DB.
- **`components/kids/add-kid-modal.tsx`** (MODIFICADO):
  - El select SALA se puebla con las opciones reales (id+nombre) que llegan del server (las 3 salas seed Soles/Lunas/Estrellas coinciden con las del mock de SPEC 05).
  - Submit: la validación inline de obligatorios de SPEC 05 se mantiene igual (no se invoca la action si quedan vacíos); al pasar, llama `createChild(null, formData)` (SPEC 11) con el `formData` de los 5 campos.
  - `ok: true` → cierra el modal, `showToast("El niño/a {Nombre} agregado a la sala {Sala}", "success")` (literal acordado en la verificación del paso 5) y `router.refresh()` para que el server re-lea la DB y la lista muestre al niño (única fuente de verdad, sin anteponer en client).
  - `ok: false` → `showToast({error de la action}, "error")` (ej. "La sala no pertenece a tu guardería") y el modal **queda abierto** con los datos intactos para reintentar.
  - El botón "Guardar" se deshabilita mientras la action está en vuelo (evita dobles INSERTs y toasts duplicados).
- **`components/kids/kid-card.tsx` / `kid-list.tsx`** (MODIFICADOS):
  - Filas de DB: `id` uuid, edad derivada de `birth_date`, fecha de ingreso derivada de `enrolled_at` (formato del mock, ej. "nov 2026"), badge VINCULAR y sin banner de padres (`parent_children` no está modelado aún — siempre sin padres).
  - Las tarjetas de niños de DB **no navegan** (`interactive={false}`, patrón de SPEC 05 para tarjetas nuevas); las mock siguen navegando a `/kids/[id]` con ids 1–8.
  - `allergy_tags` se receiben en inglés y se traducen a badge/banner en español con el mismo criterio de SPEC 05 (mapping `peanut → MANÍ`, `lactose → LACTOSA`, etc.).
- **Comportamiento de datos** (decisión del usuario): los 8 niños de `lib/kids-data.ts` SOLO aparecen como fallback (fallo de conexión o `?fail=1`). Con DB OK y 0 niños, la pantalla muestra el estado vacío (el mock desaparece de la lista normal). La separación de entornos dev/mock queda para una spec futura.

**No incluye (diferido a otras specs):**

- Perfil `/kids/[uuid]` dinámico para niños reales (las tarjetas de DB no navegan).
- Policies de RLS para `rooms`/`children`, ni migrar el admin client a session client (otra spec: modelo de acceso).
- `parent_children` y el modal "Vincular padre" (SPEC 06), "Resumen del día", editar/eliminar niños.
- Publicaciones (explícitamente fuera desde SPEC 11).
- Separación de entornos dev/mock (usuario: spec futura).
- Cualquier cambio en la DB o en `createChild` (la action se llama, no se modifica).

## Modelo de datos

**La base de datos no cambia en esta spec.** Se reutilizan las estructuras de SPEC 11 y la app agrega tipos de UI (en `lib/kids-data.ts` o el archivo correspondiente):

```ts
// Opciones del select de sala que llegan del server
type RoomOption = { id: string; name: string };

// Fila de children que llega del server (con el nombre de sala ya resuelto)
type DbKid = {
  id: string; // uuid real (PK de la tabla children)
  fullName: string;
  birthDate: string; // ISO date (birth_date)
  entryDate: string; // ISO date (enrolled_at)
  roomName: string;
  allergyTags: string[];
  medicalNotes: string | null;
};

// Lo que el server le pasa al client
type KidsLoad =
  | { ok: true; kids: DbKid[]; rooms: RoomOption[] }
  | { ok: false }; // connectionLost → el client muestra mock + toast
```

El resultado de la action se reutiliza tal cual de SPEC 11 (`CreateChildResult`). Las derivaciones de tarjeta (iniciales, edad, color de avatar, badge/banner de alergias) se recalculan desde las filas de DB con las mismas funciones existentes en `lib/kids-data.ts`, adaptadas al shape `DbKid` si hace falta.

## Plan de implementación

1. **ToastProvider genérico:** extraer `components/shared/toast-provider.tsx` (ToastProvider + useToast) reusando el componente `Toast`; `NewPostProvider` delega su `showToast`; el feed mantiene `showToast("Publicación creada")`. Manual: `npx tsc --noEmit` y `npm run build` pasan; el toast del feed se ve idéntico.
2. **Lectura server para `/kids`:** `app/(app)/kids/page.tsx` lee `{ rooms, children }` con el admin client (try/catch → mock + `connectionLost`) y envuelve el render en `<Suspense fallback={<KidsLoading/>}>`. NUEVO `components/kids/kids-loading.tsx` (spinner). Manual: build OK; `/kids` renderiza (con DB OK y 0 niños verá el estado vacío; en el remoto hoy `rooms` = 3, `children` = 0).
3. **Estados del client:** `kids-screen.tsx` consume la carga (children de DB → prepara instancias de tarjeta; 0 niños → caja centrada; `connectionLost` → toast error + mock; `?fail=1` en dev fuerza el fallo). Manual: `/kids` con DB vacía muestra el estado vacío; `?fail=1` muestra mock + toast de fallo.
4. **`kid-card` / `kid-list` para filas de DB:** adaptar shape (uuid, fechas ISO → edad/ingreso derivados, tags traducidas), tarjetas DB no-navegables y mock navegables. Manual: insertar 1–2 niños de prueba vía MCP (`execute_sql`), `npx tsc --noEmit` + build, revisar grid y filtros con las filas de prueba, y eliminarlas al terminar.
5. **Modal conecta al POST:** `add-kid-modal.tsx` acepta `rooms` (id+name), submit → `createChild`; éxito → toast "{nombre} agregado a la sala {sala}" + cerrar + `router.refresh()`; error → toast "error" + modal abierto con datos; botón deshabilitado en pending. Manual: crear un niño real desde la UI en dev, verificar por MCP que la fila existe en `children`, y que tras recargar `/kids` aparece.
6. **Verificación de la spec (spec-verifier):** `npm run build`, `npx tsc --noEmit`, `npm run lint`; consultas Context7 si Next.js 16.4.2 (cacheComponents/Suspense) lo requiere; Playwright 1280px/375px: flujo completo de crear un niño real, recarga con persistencia, estado vacío (borrando filas de prueba via MCP), spinner, `?fail=1` con toast + mock, paridad visual contra `references/screenshots` (capturas en `.playwright-mcp/`), consola 0/0.

Tras cada paso el proyecto queda compilable y funcional; el commit se hace después de cada paso verificado (por el usuario).

## Criterios de aceptación

- [x] `npm run build`, `npx tsc --noEmit` y `npm run lint` pasan sin errores.
  ✅ Verificado (9 nov 2026): lint exit 0, `tsc --noEmit` exit 0, `next build` OK — `✓ Compiled successfully`, `/kids` en ƒ (dinámica) y `/kids/[id]` con paths 1–8, con `cacheComponents`/`partialPrefetching` activos.
- [x] Existe `components/shared/toast-provider.tsx` con `ToastProvider` + `useToast()`; el feed sigue mostrando "Publicación creada" sin cambios en `new-post-launcher.tsx` (visual de la alerta idéntico).
  ✅ Verificado (9 nov 2026): `toast-provider.tsx` implementa ToastProvider/useToast sobre `Toast`; `new-post-launcher.tsx` sin cambios en el diff de git y delegación vía `useNewPostContext().showToast` en `new-post-provider.tsx`; E2E feed: publish → `status "Publicación creada"` (`.playwright-mcp/12-feed-toast-regression.png`, consola 0/0).
- [x] Con conexión OK, `/kids` muestra los niños reales de la tabla `children`: insertar 2 niños de prueba vía MCP → aparecen con nombre/edad/sala/ingreso derivados correctos; al terminar se eliminan y `/kids` muestra el estado vacío.
  ✅ Verificado (9 nov 2026): INSERT MCP de 2 filas (Alegria Rios 2023-05-02/peanut → "3 años" + badge MANÍ en SALA SOLES; Bruno Paz 2024-09-18 → "2 años" en SALA LUNAS) visible en E2E (`.playwright-mcp/12-kids-search-filter-1280.png`); buscador filtra al escribir "Alegria". Nota: la fecha de ingreso no se renderiza en el card (el mockup de /kids no la incluye; solo perfil) — derivación `kidFromDbRow` verificada por código + fila MCP. Al eliminarlas via MCP: estado vacío de nuevo (`.playwright-mcp/12-kids-empty-state-1280.png`). Interpretación aplicada y registrada: la lectura filtra `.eq("status","active")` (borrado lógico de `child_status`), coherente con "niños actuales"; anotado para el usuario.
- [x] Al cargar `/kids` aparece el spinner "Cargando niños…" como fallback del Suspense; consola 0/0 y build OK con `cacheComponents`.
  ✅ Verificado (9 nov 2026): captura del fallback renderizado (`.playwright-mcp/12-fail1-mock-toast.png` con spinner + "Cargando niños…"); SSR por streaming contiene "Cargando niños…" + `animate-spin` en el shell y el contenido real en el stream posterior (curl con cookie de sesión); Playwright consola 0 errores/0 warnings en cada página verificada; build OK.
- [x] Con `children` en 0 filas, `/kids` muestra la caja centrada "No hay niños agregados…"; con 1 niño → grid normal sin caja.
  ✅ Verificado (9 nov 2026): children=0 (via MCP) → caja "No hay niños agregados" + subtexto (`.playwright-mcp/12-kids-empty-state-1280.png`); tras el POST de Nina → grid "SALA SOLES · 1 niño" sin caja (`.playwright-mcp/12-post-nina-toast-list.png`).
- [x] Con `?fail=1` (solo desarrollo): `/kids` muestra las 8 del mock + toast variante `error` "Fallo de conexión al cargar los niños."; en producción la condición dev no tiene ningún efecto.
  ✅ Verificado (9 nov 2026): E2E `?fail=1` → 8 links mock + toast de error capturado (HTML con icono rojo `#C5503A`/`#FBD8CC`, variante error; `.playwright-mcp/12-fail1-toast-error.png`, paridad con `ninos2.png`). Producción: la condición está gateada por `process.env.NODE_ENV === "development"` en `app/(app)/kids/page.tsx` (NODE_ENV = "production" en `next build`/`next start`, con el flag al lado derecho del `&&`), por lo que `?fail=1` no tiene efecto fuera de dev.
- [x] El modal abre con las opciones SALA = las 3 salas reales (Soles/Lunas/Estrellas) y la visual del mockup de SPEC 05 intacta (labels, placeholder "Seleccionar sala", chevron).
  ✅ Verificado (9 nov 2026): snapshot del dialog con combobox SALA = option Soles/Lunas/Estrellas (uuids reales via server) + placeholder "Seleccionar sala"; captura desktop idéntica al mockup `agregar-nino.dc.html` (`.playwright-mcp/12-modal-open-1280.png`) y móvil 375px (`.playwright-mcp/12-modal-375.png`).
- [x] "Guardar" con obligatorios completos dispara el POST real: toast success con el texto literal "El niño/a {Nombre} agregado a la sala {Sala}" (ej. "El niño/a Nina Gómez agregado a la sala Soles"), el modal se cierra y tras el `router.refresh()` la lista muestra al niño creado (iniciales, edad desde `birth_date`, fecha de ingreso = hoy).
  ✅ Verificado (9 nov 2026): E2E con Nina Gómez (2022-03-12, Soles, "Maní, Lactosa") → toast literal exacto capturado con Playwright (`waitFor` sobre "El niño/a Nina Gómez agregado a la sala Soles"), modal cerrado (`dialogStillOpen:false`) y lista tras `router.refresh()` = "N · Nina Gómez · 4 años · sin padres vinculados · MANÍ" (`.playwright-mcp/12-post-nina-toast-list.png`); ingreso = 2026-11-09 (hoy) verificado en la fila MCP (el card no lo muestra — ver nota del criterio 2). Context7 `/vercel/next.js` (`use-router.mdx`): router.refresh() "re-fetching data requests, and re-rendering Server Components" sin perder estado client.
- [x] El niño creado persiste: recargar `/kids` lo mantiene y existe en el remoto (verificar fila por MCP con el `childId`).
  ✅ Verificado (9 nov 2026): recarga de `/kids` mantiene a Nina; fila en remoto con childId `dbf3c931-cd32-4f36-b971-f7eb093d9461`: full_name "Nina Gómez", birth_date 2022-03-12, room_id de Soles, allergy_tags ["peanut","lactose"] (traducción español→inglés del modal), medical_notes null, photo_consent true, status 'active'.
- [x] Click en la tarjeta de un niño de DB no navega (cursor default, sin 404); las mock siguen navegando a `/kids/[id]` 1–8.
  ✅ Verificado (9 nov 2026): click en la tarjeta de Nina → URL sigue en `/kids`, card es `div` con `cursor: default` (sin observed 404); `?fail=1` → click en Mateo Fernández mock navega a `/kids/3` (route `/kids/[id]` prerender para 1–8 según build).
- [x] Guardar con algún obligatorio vacío NO invoca la action y muestra el inline "Este campo es obligatorio" de SPEC 05 (no hay insert nuevo en el remoto).
  ✅ Verificado (9 nov 2026): click en Guardar con los 3 obligatorios vacíos → mensajes inline "Este campo es obligatorio" en nombre/fecha/sala + `aria-invalid` (`.playwright-mcp/12-modal-required-errors.png`, 375px en `.playwright-mcp/12-modal-required-375.png`); `count(children)` sin cambio (0 en ese momento).
- [x] Error del POST (`ok:false`): toast variante `error` con el mensaje exacto de la action (ej. "La sala no pertenece a tu guardería"), el modal queda abierto con los datos intactos y `count(children)` no cambia.
  ✅ Verificado (9 nov 2026): reproducible E2E vía `?fail=1` (salas mock con id="" → la action rechaza con "Selecciona una sala válida."): toast error capturado, modal queda ABIERTO con datos intactos (nombre "Error Test", 12/03/2022, Soles; `.playwright-mcp/12-post-error-modal-open.png`) y `count(children)` sin cambio (remoto solo con Nina). Lectura de código en `add-kid-modal.tsx` (rama `else`: no onClose, no router.refresh, showToast(result.error,"error")) y mensajes exactos en `actions/children.ts` ("La sala no pertenece a tu guardería." entre ellos).
- [x] Mientras la action está en vuelo, "Guardar" está deshabilitado (sin dobles inserts ni toasts duplicados).
  ✅ Verificado (9 nov 2026): polling del atributo disabled durante el POST de Nina: `disabled=true` en 10/11 muestras (60ms→450ms tras el click) y después solo el toast success; un único INSERT en remoto (children solo con Nina).
- [x] Ningún archivo de DB cambia (sin migraciones nuevas) y `utils/supabase/admin.ts` / `actions/children.ts` quedan intactos (el modal los llama, no los modifica).
  ✅ Verificado (9 nov 2026): `git status` sin migraciones nuevas y sin cambios en `admin.ts`/`actions/children.ts`/`new-post-launcher.tsx` (solo consumidos). Los inserts/deletes de niños de prueba se hicieron VIA MCP (datos, no schema).

## Decisiones

- **Sí:** ToastProvider genérico (decisión del usuario). El contexto de posts exponiendo toasts de niños era deuda semántica; extraerlo antes de reutilizarlo en `/kids` no toca el visual ni la API del feed.
- **No:** reusar `useNewPostContext().showToast` tal cual en `/kids`. Menos código hoy, contexto mal denominado y acoplamiento innecesario con el feed.
- **Sí:** salas reales con uuid vía lectura server con admin client (decisión del usuario). El POST exige un `room_id` de la daycare del staff; los nombres del mock no son la fuente de verdad. `/kids` pasa a dinámica (aceptado).
- **No:** mantener opciones hardcodeadas y mapear nombre→uuid en la action. La fuente de salas viviría en código mientras la tabla `rooms` existe.
- **Sí:** `/kids` lee de la DB (decisión del usuario, amplió el scope): lista de única fuente de verdad + spinner + estado vacío + fallback.
- **Sí:** mock SOLO como fallback (decisión del usuario). Mezclar mock + DB duplicaría filas en el futuro.
- **Sí:** `router.refresh()` tras el POST exitoso (decisión del usuario). El server re-lee y el grid se actualiza; sin duplicación de estado server/client.
- **No:** anteponer client-side tras el POST. Mezclaria un estado client derivado con la lectura server recién implementada.
- **Sí:** spinner simple centrado + texto (decisión del usuario): estados sin mockup, mínimo y coherente con la paleta.
- **Sí:** estado vacío con mensaje y subtexto centrados (decisión del usuario).
- **Sí:** tarjetas de niños de DB no navegan (decisión del usuario): `/kids/[uuid]` no existe; precedent SPEC 05 (tarjeta nueva sin link). El perfil real va en otra spec.
- **Sí:** flag `?fail=1` dev-only para verificar la desconexión. Sin él, el camino de fallo no era reproducible en el stack de verificación; gateado con `NODE_ENV=development`.
- **Sí:** la validación inline de obligatorios de SPEC 05 se mantiene client-side; la action solo se invoca tras pasarla. Los errores de la action van al toast `error` (decisión del usuario), no a inline.
- **Sí:** toast de éxito contextual: "{Nombre} agregado a la sala {Sala}" (decisión del usuario).
- **Sí:** literal del toast de éxito "El niño/a {Nombre} agregado a la sala {Sala}" (decisión del usuario al cerrar el paso 5: indistinto de género, sin funciones de heurística).
- **Sí:** el modal traduce las etiquetas conocidas de alergia español→inglés (maní→peanut, lactosa→lactosa…) antes de llamar `createChild` (decisión del usuario al cerrar el paso 5): respeta el contrato de SPEC 11 ("lo persistido va en inglés") manteniendo el placeholder español del mockup; las desconocidas pasan en minúscula.
- **No:** policies de RLS ni cambios en `admin.ts`/`actions/children.ts` en esta spec; la UI las llama tal cual (SPEC 11).

## Riesgos

| Riesgo                                                                          | Mitigación                                                                                                                                                                           |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/kids` pasa de estática a dinámica por leer DB (`cacheComponents`)             | Aceptado y registrado: la lectura async queda dentro del `Suspense` con spinner; consultar Context7/docs locales de Next 16.4.2 si el streaming interferie con `partialPrefetching`. |
| El admin client en el server render lo importa alguien del client               | Sigue `server-only` (SPEC 11): un import desde client rompe el build inmediatamente. El gate del flag dev cubre el costo por request.                                                |
| Derivaciones con `Date` en el client durante el render rompen `cacheComponents` | Las derivaciones corren en el server (pasadas como string) o en handlers; fechas desde ISO strings para render determinista. Context7/docs locales si hacen falta guías.             |
| El flag `?fail=1` pudiera filtrarse a producción                                | Gate estricto `process.env.NODE_ENV === 'development'`; criterio de aceptación que lo verifica.                                                                                      |
| Los 8 mock desaparecen de `/kids` en desarrollo (esperado con DB OK y 0 niños)  | Decisión registrada del usuario; la posibilidad de alternar dev con mocks se trata en una spec futura.                                                                               |
| Los niños de SPEC 05 creados client-side se pierden al recargar                 | Ya era así (estado useState, sin persistencia); no cambia ahora.                                                                                                                     |

## Qué **no** está en esta spec

- Perfil `/kids/[uuid]` para niños reales.
- Policies RLS de `rooms`/`children` y migración de admin client → session client.
- "Vincular padre", editar/eliminar niños, resumen diario.
- Separación de entornos dev/mock.
- Publicaciones y el resto de tablas del esquema.

Cada uno de esos, si aterriza, va en su propia spec.
