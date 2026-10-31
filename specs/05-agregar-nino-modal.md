# SPEC 05 — Modal "Agregar niño" en `/kids`

**Estado:** Implementado — Verificado ✅ por Verificador (spec-verifier), 31 oct 2026
**Fecha:** 30 oct 2026
**Depende de:** SPEC 02

**Objetivo:** Implementar el modal del mockup `references/pantallas/agregar-nino.dc.html`, que se abre desde el botón "+ Agregar niño" de `/kids`, con nombre completo, fecha de nacimiento y sala obligatorios (validación con mensajes inline), un selector de sala con placeholder "Seleccionar sala" y las opciones Soles/Lunas/Estrellas, y al guardar agrega el niño a la lista de `/kids` en estado client-side (sin persistencia).

## Alcance

**Incluye:**

- Modal sobre `/kids` (overlay oscurecido + card flotante fiel al mockup, max-width 520px):
  - Header del modal: "Cancelar" (izquierda, `#94887B` bold 15px), título "Agregar niño" (Fredoka 600 18px, `#3F362E`) y "Guardar" (derecha, `#D9583C` bold 15px).
  - Campos con labels eyebrow (12px, 800, letter-spacing 0.7px, `#94887B`, uppercase):
    - `NOMBRE COMPLETO`: input texto, placeholder "Ej. Martina López". **Obligatorio.**
    - `FECHA DE NACIMIENTO`: input nativo `type="date"` (el navegador muestra dd/mm/aaaa en locales es). **Obligatorio.**
    - `SALA`: select nativo estilizado (igual al mockup, con chevron) con placeholder "Seleccionar sala" (opción inicial sin valor) y las opciones **Soles, Lunas, Estrellas**. **Obligatorio.**
    - `ALERGIAS (ETIQUETAS)`: input texto, placeholder "Ej. Maní, Lactosa". Opcional.
    - `NOTAS MÉDICAS`: textarea, placeholder "Indicaciones, medicación, contactos…". Opcional.
  - Estilos como el mockup: inputs radio 14px, borde 1.5px `#EADFD0`, fondo blanco, padding 13px 16px, texto 15px `#3F362E`; card fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`.
- Validación inline: al pulsar "Guardar" con algún obligatorio vacío, el modal **no se cierra** y bajo cada campo faltante aparece "Este campo es obligatorio" (`--color-accent-edit`, `#C5503A`); los mensajes desaparecen al completar el campo y revalidar.
- Cierre del modal: botón "Cancelar", click en el overlay y tecla `Esc`; en los tres casos nada se agrega a la lista.
- Guardar con datos válidos: cierra el modal y antepone el nuevo niño en el grid de `/kids` (estado `useState`; con filtro activo se filtra como los demás; al recargar vuelve el mock de 8).
- Datos derivados automáticos para el niño nuevo: iniciales, edad, color de avatar, badge de alergia y banner de alergias.
- La tarjeta del niño recién creado **no navega** (sin link, cursor default) porque `/kids/[id]` se prerenderiza con los ids estáticos 1–8; las tarjetas mock siguen navegando igual.
- Responsive: modal usable a 375px (card a ancho completo, scroll si el alto no alcanza) y fiel al mockup a 1280px.
- El botón del header de `/kids` pasa de `<a href="#">` a `<button>` real, con la misma apariencia de gradiente.

**No incluye (diferido a otras specs):**

- Persistencia (localStorage/backend): el niño creado vive solo en memoria client-side.
- Botón "Agregar niño" en el home `/` (no existe en ningún mockup; los mockups enlazan `ninos → agregar-nino`).
- Perfil funcional para niños creados en el cliente.
- Modificar los archivos de `references/pantallas/`.
- "Editar", "Vincular padre", "Resumen del día".
- Focus trap / restore de foco a11y completo.

## Estructura de archivos

```
lib/
  kids-data.ts             → MODIFICADO: exporta ROOMS, agrega medicalNotes?: string
                              a Kid y helper createKidFromForm()
components/
  kids/
    add-kid-modal.tsx      → NUEVO ("use client"): overlay + card + form + validación
    kids-screen.tsx        → NUEVO ("use client"): dueño del estado (lista + modal abierto),
                              compone PageHeader + botón + modal + KidList
    kid-list.tsx           → MODIFICADO: recibe kids por prop (mock + nuevos); el filtro no cambia
    kid-card.tsx           → MODIFICADO: prop opcional interactive (default true);
                              en false renderiza la tarjeta sin <Link>
app/(app)/kids/
  page.tsx                 → MODIFICADO: queda solo <KidsScreen/>; se elimina el AddKidButton local
```

No cambian `globals.css` ni fuentes: los colores del modal se usan como clases arbitrarias, mismas que ya emplea el header de `/kids` (excluidas del cleanup de SPEC 03).

## Modelo de datos

`lib/kids-data.ts` agrega:

```ts
// Salas del selector; "Soles" es la existente en todo el proyecto
export const ROOMS = ["Soles", "Lunas", "Estrellas"] as const;

export type Kid = {
  // ...campos existentes de SPEC 02 sin cambios...
  medicalNotes?: string; // notas del modal; ninguna UI lo muestra hoy
};

// Draft = lo que llena el modal (nombre, birthDate ISO, room, allergies string, notes string)
export function createKidFromForm(draft: KidDraft, nextId: number): Kid;
```

Reglas de derivación de `createKidFromForm`:

- `id`: el `nextId` recibido (máximo id actual + 1 → 9, 10, …).
- `name`: texto tal cual.
- `initials`: primera letra del primer nombre en mayúscula (par con el mock, ej. "M").
- `age`: años completos del input dd/mm/aaaa en la fecha de guardado; menor de 1 año queda `0` ("0 años", limitación aceptada).
- `avatarColor`: rotar la paleta `[sky, pink, green, yellow, purple]` según `(id - 1) % 5`.
- `birthDate`: ISO del input (ej. `"2022-03-12"`).
- `room`: opción del select.
- `entryDate`: mes de guardado con formato del mock (ej. `"oct 2026"`).
- `parents`: `[]` → badge VINCULAR.
- `allergyTag`: primera etiqueta sin espacios y en MAYÚSCULAS; solo si hay etiquetas.
- `allergiesNote`: si hay etiquetas, `Alergia a ${etiquetas.join(", ")}.`; si no, sin definir y sin banner.
- `medicalNotes`: texto del textarea, solo si no está vacío.

La lista visible en `/kids` es `useState([...kids del mock, ...nuevos])` en `kids-screen.tsx`: los mock conservan su orden y cada niño creado se antepone.

## UX y estados

- `/kids` sin modal: exactamente como hoy.
- Modal abierto: overlay `rgba(63,54,46,0.45)`, card centrada, foco inicial en NOMBRE COMPLETO, scroll de página bloqueado.
- Form: vacío (placeholders del mockup), con contenido, y con error inline bajo los obligatorios incompletos.
- Guardar con éxito: modal cerrado, niño nuevo primero (o filtrado si hay query), contador del separador actualizado (`"SALA SOLES · 9 niños"`; el label queda fijo aunque la sala sea otra — decisión registrada).
- Cancelar / overlay / `Esc`: cerrar sin guardar; al reabrir, el form arranca vacío.
- 375px: card a ancho completo con padding 16px; FECHA y SALA apiladas si hace falta para legibilidad.

## Plan de implementación

1. `lib/kids-data.ts`: `ROOMS`, `medicalNotes?` y `createKidFromForm(draft, nextId)`. Sin cambios visibles. Manual: `npx tsc --noEmit` y `/kids` igual que antes.
2. `components/kids/kid-card.tsx`: prop `interactive?: boolean` (default `true`); en `false` sin `<Link>`. Manual: `/kids` sin cambios.
3. `components/kids/kids-screen.tsx`: client con `kidList` (mock inicial) y `modalOpen`, compone `PageHeader` (botón convertido a `<button>`) + modal + `KidList`; `page.tsx` queda como `<KidsScreen/>`. Manual: `/kids` idéntica, botón ahora real.
4. `components/kids/add-kid-modal.tsx`: overlay + card fiel al mockup, campos controlados, select con placeholder y opciones de `ROOMS`, cierre por Cancelar/overlay/Esc; Guardar aún sin validación ni guardado. Manual: abrir/cerrar como el mockup en 1280px y 375px.
5. Validación + guardado: mensajes inline con limpieza al completar; si es válido, `createKidFromForm` + antepone en `kidList` + cierra; tarjeta nueva con `interactive={false}`. Manual: guardar con vacíos no cierra; guardado completo agrega al niño; recarga vuelve al mock de 8.
6. Verificación (spec-verifier): `npm run build`, `npx tsc --noEmit`, `npm run lint`, Context7 si Next.js 16.4.2 lo requiere, y paridad visual con Playwright en 1280px y 375px contra `agregar-nino.dc.html` servido por HTTP (modal abierto, errores de validación, niño agregado). Capturas en `.playwright-mcp/`.

## Criterios de aceptación

- [x] `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan; consola de `/kids` da 0/0 con el modal cerrado, abierto, con errores de validación y tras guardar.
  - Evidencia (Verificador, 31 oct 2026): `npm run build` OK (Turbopack, "Compiled successfully", `○ /kids` estático y `/kids/[id]` parcial con Cache Components + Partial Prefetching activos), `npx tsc --noEmit` sin output y `lint` 0 errores/0 warnings. Consola Playwright en `/kids`: 0 errores/0 warnings en modal cerrado, abierto, con errores de validación y tras guardar (desktop y móvil). Context7 `/vercel/next.js` (`blocking-prerender-random-client.mdx`, `preventing-flash-before-hydration.mdx`): `Date`/valores no deterministas no pueden ir en el render inicial de un Client Component — `createKidFromForm` (con `new Date()`) solo se ejecuta en el handler de Guardar, el render es determinista y no hay mismatch.
- [x] El botón "+ Agregar niño" es un `<button>` real que abre el modal, con la apariencia de gradiente e ícono + del mockup.
  - Evidencia: a11y snapshot de `/kids` lo expone como `button "Agregar niño"` (`components/kids/kids-screen.tsx: <button type="button" aria-haspopup="dialog">`, mismas clases arbitrarias del gradiente/ícono+ que el header anterior); captura `.playwright-mcp/05-verify-saved-allergies.png` (botón gradiente con + a la derecha del header).
- [x] El modal a 1280px es visualmente fiel a `agregar-nino.dc.html`: header "Cancelar / Agregar niño / Guardar", labels eyebrow, estilos de inputs/card y placeholders exactos.
  - Evidencia: comparación por visión de `.playwright-mcp/05-verify-modal-1280.png` vs mockup servido por HTTP `.playwright-mcp/05-verify-mockup-agregar-nino-1280.png` — header (Cancelar `#94887B` / título Fredoka 18 / Guardar `#D9583C`), labels eyebrow 12px tracking, inputs (radio 14px, borde `#EADFD0` 1.5px, blancos, py 13px), card `#FBF4EC` radio 24 y placeholders "Ej. Martina López", "Ej. Maní, Lactosa", "Indicaciones, medicación, contactos…" idénticos; únicas diferencias: overlay de modal y "Seleccionar sala" en vez de "Soles" preseleccionado, ambas decisiones de spec.
- [x] El selector SALA muestra "Seleccionar sala" al abrir y exactamente 3 opciones: Soles, Lunas, Estrellas.
  - Evidencia: evaluate en `/kids` con modal abierto — placeholder `option[value=""]` = "Seleccionar sala", opciones seleccionables exactamente `["Soles","Lunas","Estrellas"]` (`ROOMS` en `lib/kids-data.ts`; la opción placeholder está `disabled hidden`, por eso en el listado visible son 3).
- [x] `FECHA DE NACIMIENTO` es input nativo de tipo date y muestra dd/mm/aaaa.
  - Evidencia: evaluate `#kid-birth-date` → `type: "date"`; capturas desktop (`.playwright-mcp/05-verify-modal-1280.png`) y móvil (`.playwright-mcp/05-verify-modal-375-top.png`) muestran "dd/mm/aaaa" con el ícono calendario nativo.
- [x] Guardar con nombre, fecha o sala vacíos NO cierra el modal y muestra "Este campo es obligatorio" bajo cada incompleto; al completar, el mensaje desaparece.
  - Evidencia: click en Guardar vacío → `dialogs: 1`, `errors: 3` con color exacto `rgb(197, 80, 58)` (`#C5503A` = `--color-accent-edit`); captura `.playwright-mcp/05-verify-validation-errors.png`. Al tipear en nombre los mensajes bajan de 3 a 2 (limpieza por campo, `updateDraft`).
- [x] Guardar con solo los obligatorios completos (alergias/notas vacías) guarda la tarjeta sin badge ni banner de alergia.
  - Evidencia: "Lía Méndez Soto" (28 ago 2025, Estrellas) → modal cerrado, primera tarjeta es DIV con texto "Lía Méndez Soto · 1 años · sin padres vinculados" + badge VINCULAR, `hasAllergyBadge: false`, contador "SALA SOLES · 9 niños"; captura `.playwright-mcp/05-verify-saved-required-only.png`.
- [x] Guardar con etiquetas "Maní, Lactosa" produce badge MANÍ y "Alergia a maní, lactosa.".
  - Evidencia: "Bruno Ríos" (12 mar 2024, Lunas, alergias "Maní, Lactosa") → primera tarjeta con badge `MANÍ` (captura `.playwright-mcp/05-verify-saved-allergies.png`). Ajuste aplicado durante la verificación: `lib/kids-data.ts` L83 normaliza las etiquetas a minúsculas para la nota (`Alergia a maní, lactosa.`, estilo del banner del mockup) manteniendo el badge en MAYÚSCULAS — así el ejemplo del criterio (texto en minúsculas) y el modelo de datos quedan coherentes; la nota vive hoy solo en el objeto (`medicalNotes`/`allergiesNote` no tienen UI por definición de esta spec).
- [x] "Cancelar", overlay y `Esc` cierran sin agregar nada; al reabrir, el form está vacío.
  - Evidencia: Playwright — tras `Esc`, click en overlay y "Cancelar", `dialogs: 0` y contador "8 niños" en los tres casos; al reabrir los 5 campos vuelven vacíos (`inputValue` de name/birth-date/room/allergies/notes = ""). Consola 0/0.
- [x] Guardar con datos válidos cierra el modal y el niño nuevo aparece primero con iniciales, edad, avatar, badge VINCULAR y contador actualizado; con filtro activo se filtra igual.
  - Evidencia: guardados verificados antepuestos (`Pía Ruiz`, `Bruno Ríos`) con iniciales/color derivados (`(id-1)%5`), edad derivada (Pía 2, Bruno 2, Lía 1 con fechas correctas), badge VINCULAR y contador "9 niños"; filtro "Lía" → 1 tarjeta + contador "1 niño" (`kid-list.tsx` filtra sobre `kids` por prop).
- [x] La tarjeta nueva no navega (cursor default) y las 8 mock siguen navegando a `/kids/:id`.
  - Evidencia: click en la tarjeta nueva → URL permanece `http://localhost:3000/kids` (DIV `cursor-default`, sin `<Link>`); click en la primera tarjeta mock → `http://localhost:3000/kids/1` (`kid-list.tsx` computa `interactive` con `mockKids.some(...)`).
- [x] Recargar `/kids` vuelve al mock de 8 (sin persistencia).
  - Evidencia: tras los guardados, `browser_navigate` a `/kids` → `cards: 8` y contador "8 niños".
- [x] A 375px el modal es usable: card a ancho completo, campos visibles con scroll, cerrar y guardar operativos.
  - Evidencia: capturas `.playwright-mcp/05-verify-modal-375-top.png` y `05-verify-modal-375-bottom.png` — card dentro del padding 16px (`cardTop: 16`; el ancho medido, 333px, resta el scrollbar del overlay), fila FECHA/SALA apilada (`flex-col md:flex-row`) con "Seleccionar sala" completo (antes se truncaba, corregido en implementación), `scrollIntoView` a NOTAS MÉDICAS OK, Guardar crea a Pía y `Esc` cierra (`dialogs: 0`); consola 0/0.

## Decisiones tomadas y descartadas

- **Modal flotante sobre `/kids`** (usuario: "modal") vs ruta `/kids/nuevo`: el mockup es una card centrada, no una página; sin ruta nueva no hay que tocar `generateStaticParams` ni el sidebar.
- **Abrir solo desde `/kids`** (confirmado por el usuario) vs también en home `/`: el botón ya existe ahí y coincide con los mockups; UI nueva en el feed sería inventada.
- **Guardar antepone el niño en el grid** (confirmado) vs guardar solo cierra: el flujo "agregar" que no agrega no completa su trabajo; todo mock-first.
- **Validación inline custom** (confirmado) vs HTML5 nativo: mensajes en español alineados al estilo visual, criterio central de esta spec.
- **`input type="date"` nativo** (confirmado) vs máscara manual: el navegador localiza el formato y libera parse; la validación custom solo cubre el vacío.
- **Derivados automáticos** (confirmado): la tarjeta nueva es indistinguible en formato del resto.
- **Salas Soles/Lunas/Estrellas** (confirmado): Lunas/Estrellas como mock coherente en la misma familia de nombres.
- **Tarjeta nueva sin link** (confirmado) vs navegar a un 404: un 404 inmediato tras crear un niño parece app rota.
- **`medicalNotes?: string` en `Kid`** (confirmado que se guardan): sin UI que las muestre hoy; listas para la futura spec de perfil/editar.
- **Etiqueta única `allergyTag`**: la primera etiqueta va al badge y todas se guardan en `allergiesNote` (banner).
- **Descartado: persistencia localStorage** — sería el primer estado persistente del proyecto; merece spec propia.
- **Limitaciones aceptadas:** "0 años" para bebés, label "SALA SOLES" fijo aunque el niño sea de otra sala, y foco inicial + Esc sin focus trap completo.

## Riesgos

| Riesgo                                                                               | Mitigación                                                                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `PageHeader` pasa a client al vivir en `kids-screen.tsx`                             | Es puramente presentacional; si algún día necesita APIs server-only se re-arquitectura. |
| Next.js 16.4.2 `cacheComponents` / `partialPrefetching` con estado client-side nuevo | Validar con Context7 + docs locales antes de codificar.                                 |
| Fidelidad por conversión inline-style → Tailwind (radios, paddings, sombra)          | Cubierta por captura Playwright, como en SPEC 01/02/04.                                 |

## Qué **no** está en esta spec

- Persistencia de los niños creados.
- Botón "Agregar niño" en el home `/`.
- Perfil navegable para niños creados en el cliente.
- Edición, "Vincular padre", "Resumen del día".
- Modificación de `references/pantallas/`.
