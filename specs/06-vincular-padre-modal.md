# SPEC 06 — Modal "Vincular padre" en `/kids/[id]`

**Estado:** Implementado — Verificado ✅ por Verificador (spec-verifier), 4 nov 2026
**Fecha:** 2026-11-04
**Depende de:** SPEC 02

**Objetivo:** Implementar el modal del mockup `references/pantallas/vincular-padre.dc.html`, que se abre desde el botón "Vincular otro padre" del perfil del niño en `/kids/[id]`, con nombre y email obligatorios (validación inline), parentesco preseleccionado en "Mamá", un código de invitación de 5 caracteres generado al abrir, y al enviar antepone una fila PENDIENTE en "PADRES VINCULADOS" en estado client-side (sin persistencia).

## Alcance

**Incluye:**

- Modal (overlay oscurecido + card flotante fiel al mockup, max-width 480px) sobre `/kids/[id]`:
  - Header del modal: título "Vincular padre" (Fredoka, 18px, `#3F362E`) y subtítulo "a {nombre del niño}" (13px, `#A89A8B`), con botón X de cierre a la derecha (icono de la X del mockup, 34px, fondo `#F0E6D8`).
  - Banner de información azul (`#E3ECFB`, texto `#3F5694`, 13.5px): "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {nombre}." con el ícono ⓘ del mockup; el nombre se interpolan desde el niño del perfil.
  - Campos con labels eyebrow (12px, 800, letter-spacing 0.7px, `#94887B`, uppercase):
    - `NOMBRE DEL PADRE/MADRE`: input texto, placeholder "Ej. Diego Fernández". **Obligatorio.**
    - `EMAIL`: input `type="email"`, placeholder "correo@ejemplo.com". **Obligatorio y con formato de email válido.**
  - `PARENTESCO`: 3 chips en fila (radio 999px, flex 1, padding 11px, 14px bold) con exactamente las opciones **Mamá, Papá, Tutor/a**; "Mamá" llega preseleccionado (borde `#9FB8EC`, fondo `#CCD8F4`, texto `#4E72C8`) y el click cambia el chip activo (no seleccionados: borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359`).
  - Caja amarilla punteada (fondo `#FBF1D6`, borde dashed `#E6D08A`, radio 16px): label `CÓDIGO DE INVITACIÓN`, código de 5 caracteres en Fredoka 600 34px letter-spacing 7px texto `#8A7234`, y texto fijo "Vence en 7 días" (13px, `#A88526`).
  - Botón principal **"Enviar invitación"**: ancho completo, gradiente `#F4977E → #EE8164`, radio 14px, ícono de avión (paper plane) del mockup.
  - Estilos de card como el mockup: fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`; inputs radio 14px, borde 1.5px `#EADFD0`, fondo blanco, padding 13px 16px, texto 15px.
- Validación inline al pulsar "Enviar invitación": con nombre o email vacíos aparece "Este campo es obligatorio" bajo cada campo faltante, y con texto en EMAIL que no matchea un formato email aparece "Ingresa un email válido" (color `--color-accent-edit`, mismo tratamiento de SPEC 05); los mensajes desaparecen al corregir el campo; con errores el modal **no se cierra**.
- Generación del código: aleatorio de 5 caracteres del alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (mayúsculas sin O/I/L ni 0/1), se **regenera en cada apertura** del modal (el código mostrado nunca proviene del render inicial para evitar mismatch con `cacheComponents`).
- Cierre del modal: X del header, click en el overlay y tecla `Esc`; en los tres casos nada se agrega.
- "Enviar invitación" con datos válidos: cierra el modal y **antepone** una fila PENDIENTE en el registro "PADRES VINCULADOS" del perfil (estado `useState` en client; al recargar vuelve al mock del niño).
- Fila NUEVA con el mismo formato que las existentes: avatar con inicial + color derivado, nombre en bold, `{relation} · {email}` como subtexto y badge `PENDIENTE`.
- Responsive: modal usable a 375px (card a ancho completo, scroll si el alto no alcanza) y fiel al mockup a 1280px.
- El botón "Vincular otro padre" del perfil pasa de `<a href="#">` a `<button>` real, con la misma apariencia (círculo punteado + texto `text-accent-edit`).

**No incluye (diferido a otras specs):**

- Envío real de email / integración con backend o mailto del navegador.
- Activación del padre con el código (eso vive en `/activar-cuenta`, SPEC 04).
- Persistencia (localStorage/backend): la fila nueva vive solo en memoria client-side.
- Editar o eliminar padres vinculados ya existentes.
- Disparar el modal desde otro punto distinto del perfil del niño (confirmado: solo ahí).
- Expiración real de 7 días ni contadores: "Vence en 7 días" es texto fijo del mockup.
- Focus trap / restore de foco a11y completo.
- Modificar los archivos de `references/pantallas/`.

## Estructura de archivos

```
lib/
  kids-data.ts                         → MODIFICADO: agrega INVITATION_RELATIONS,
                                          INVITATION_CODE_ALPHABET, INVITATION_CODE_LENGTH,
                                          generateInvitationCode() y
                                          createPendingParentFromForm() (+ LinkedParentDraft)
components/kids/
  link-parent-modal.tsx                → NUEVO ("use client"): overlay + card + form + validación
  link-parent-card.tsx                 → NUEVO ("use client"): dueño del estado (filas + modal
                                          abierto); incluye LinkedParentRow y el botón real
app/(app)/kids/[id]/page.tsx           → MODIFICADO: elimina LinkParentCard/LinkedParentRow
                                          (se mudan al client) y usa <LinkParentCard
                                          parents={kid.parents} kidName={kid.name}/>
```

No cambian `globals.css` ni fuentes: los colores del modal se usan como clases arbitrarias de Tailwind, mismas convenciones del header del perfil y de SPEC 05.

## Modelo de datos

`lib/kids-data.ts` agrega:

```ts
// Opciones del selector PARENTESCO (chips); "Mamá" es el default del modal
export const INVITATION_RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
export const INVITATION_CODE_LENGTH = 5;
// Mayúsculas y dígitos sin caracteres ambiguos (sin O/I/L/0/1)
export const INVITATION_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Draft = lo que llena el modal (nombre, email, relation ya resuelta)
export type LinkedParentDraft = {
  name: string;
  email: string;
  relation: string; // opción de INVITATION_RELATIONS
};

export function generateInvitationCode(): string; // 5 chars del alfabeto

// Convierte el draft en una fila PENDIENTE para Kid.parents
export function createPendingParentFromForm(
  draft: LinkedParentDraft,
  nextId: number,
): LinkedParent;
```

Reglas de derivación de `createPendingParentFromForm`:

- `id`: el `nextId` recibido (máximo `id` existente entre los `parents` de todos los `kids` del mock + 1).
- `name`: texto tal cual.
- `relation`: la opción del chip activo.
- `note`: el email tal cual (la fila lo muestra como `{relation} · {email}`).
- `status`: siempre `"pending"` → badge PENDIENTE.
- `avatarColor`: alternar `"blue"`/`"purple"` según `nextId % 2` (los valores permitidos del tipo).

`LinkedParent`, `Kid` y el resto del modelo de SPEC 02 no cambian.

## UX y estados

- Perfil del niño sin modal: exactamente como hoy (las filas mock, activas y pendientes, se ven igual; el único cambio es que el trigger ahora es un `<button>`).
- Modal abierto: overlay `rgba(63,54,46,0.45)`, card centrada, scroll de página bloqueado; el código visible se generó al abrir (distinto en cada apertura).
- Form: vacío (placeholders del mockup) con "Mamá" activo; con contenido; y con errores inline bajo los obligatorios incompletos o el email con formato inválido.
- Enviar con éxito: modal cerrado, fila PENDIENTE nueva **primera** en "PADRES VINCULADOS".
- Cancelar (X) / overlay / `Esc`: cerrar sin guardar; al reabrir, el form arranca vacío con "Mamá" y un código nuevo.
- 375px: card a ancho completo con padding 16px y scroll interno si hace falta.

## Plan de implementación

1. `lib/kids-data.ts`: `INVITATION_*`, `LinkedParentDraft`, `generateInvitationCode()` y `createPendingParentFromForm()`. Sin cambios visibles. Manual: `npx tsc --noEmit` y `/kids/[id]` igual que antes.
2. `components/kids/link-parent-card.tsx`: client component con `parents`/`kidName` por props, estado `rows` (mock inicial) + `modalOpen`; muda `LinkedParentRow` desde `page.tsx` sin cambios visuales y convierte el trigger en `<button aria-haspopup="dialog">`. Manual: `/kids/[id]` idéntica; botón real.
3. `components/kids/link-parent-modal.tsx`: overlay + card fiel al mockup, campos controlados, chips con "Mamá" activo, código generado al abrir, cierre por X/overlay/Esc; "Enviar invitación" aún sin validación ni guardado. Manual: abrir/cerrar como el mockup a 1280px y 375px.
4. Validación + guardado: mensajes inline con limpieza al corregir; si es válido, `createPendingParentFromForm` + antepone en `rows` + cierra. Manual: guardar con vacíos/ email invalido no cierra; guardar válido agrega la fila; recarga vuelve al mock.
5. `page.tsx`: elimina `LinkParentCard`/`LinkedParentRow` (ya mudas) y renderiza el client. Manual: `/kids/[id]` sin regresiones y consola 0/0.
6. Verificación (spec-verifier): `npm run build`, `npx tsc --noEmit` y `npm run lint`, Context7 si Next.js 16.4.2 lo requiere, y paridad visual con Playwright a 1280px y 375px contra `vincular-padre.dc.html` servido por HTTP (modal abierto, errores de validación, invitado agregado). Capturas en `.playwright-mcp/`. Además: `Math.random()`/`Date` nunca en el render inicial del client (deferir la generación del código a la apertura) y props serializables server → client.

## Criterios de aceptación

> Verificación completa (Verificador, 4 nov 2026): `npm run build` OK (Turbopack
> "Compiled successfully", Cache Components + Partial Prefetching activos,
> `○ /kids/1` y `/kids/2` estáticos, resto `◐ /kids/[id]`), `npx tsc --noEmit`
> exit 0 y `npm run lint` exit 0. Sesión completa Playwright (capturas en
> `.playwright-mcp/06-verify-*.png`) con consola 0 errores/0 warnings en los 4
> estados pedidos (cerrado, abierto, errores de validación, tras enviar).
> Context7 `/vercel/next.js`: `io.mdx` / `08-caching.mdx` ("Random values and
> timestamps") — `Math.random()` ejecutado en el navegador (handler de apertura)
> queda fuera del prerender y es correcto; `05-server-and-client-components.mdx`
> / `use-client.mdx` — props server→client serializables (`parents`, `kidName`;
> las funciones solo cruzan entre clients, no desde la página server).

- [x] `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan; la consola de `/kids/[id]` da 0 errores y 0 warnings con el modal cerrado, abierto, con errores de validación y tras enviar.
  - Evidencia (Verificador, 4 nov 2026): build OK (16/16 prerenderizados, `/kids/1` estático), tsc y lint sin output; consola Playwright de la sesión completa (`.playwright-mcp/06-verify-*.png` + `console-2026-11-04T19-54-38-899Z.log`): solo logs de DevTools/HMR — 0 errores/0 warnings.
- [x] El botón "Vincular otro padre" es un `<button>` real con `aria-haspopup="dialog"` que abre el modal, con la apariencia intacta (círculo punteado `#D8CBBA` + texto `text-accent-edit`).
  - Evidencia: evaluate en `/kids/1` — `isButton: true`, `aria-haspopup="dialog"`, `cursor: pointer` (`components/kids/link-parent-card.tsx`); captura `.playwright-mcp/06-verify-saved-row.png` (círculo punteado + texto acento).
- [x] El modal a 1280px es visualmente fiel a `vincular-padre.dc.html`: header "Vincular padre / a {niño}" con X, banner azul, labels eyebrow, estilos de inputs/card, chips de parentesco, caja amarilla dashed y botón gradiente "Enviar invitación" con el ícono paper plane, y el subtítulo/banner interpolan el nombre real del niño (`getKidById`).
  - Evidencia: comparación por visión de `.playwright-mcp/06-verify-modal-1280.png` vs `.playwright-mcp/06-verify-mockup-1280.png` (mockup servido por HTTP en :8899) — header/subtítulo "a Mateo Fernández" + X `#F0E6D8`, banner `#E3ECFB` con ⓘ y texto idéntico ("Solo verá el feed de Mateo.", primer nombre como el mock), placeholders exactos, chips, caja `#FBF1D6` dashed con código Fredoka + tracking y "Vence en 7 días", gradiente + paper plane. Única diferencia: overlay del modal sobre el perfil (decisión de modal real de la spec).
- [x] PARENTESCO muestra exactamente 3 opciones (Mamá, Papá, Tutor/a), llega con "Mamá" activo y el click mueve el estilo activo entre chips.
  - Evidencia: evaluate — chips exactos `["Mamá","Papá","Tutor/a"]`, "Mamá" con `border-[#9FB8EC]`/`bg-[#CCD8F4]` al abrir; tras click en "Papá": Papá activo y Mamá cambia a `border-[#ECE0D0]`/`bg-[#FFFDF9]` (captura `.playwright-mcp/06-verify-invalid-email.png`, chip activo ya movido a Papá).
- [x] El código de la caja amarilla son 5 caracteres del alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` y se regenera (distinto del anterior) en cada apertura del modal; el texto "Vence en 7 días" está siempre.
  - Evidencia: aperturas consecutivas generaron `J7EDB` → `GDBJ4` (evaluate confirma 5 chars y `alphabetOk: true` contra el alfabeto); "Vence en 7 días" presente en todas las capturas; la generación vive en `openModal` (handler), nunca en el render inicial.
- [x] Enviar con nombre o email vacíos NO cierra el modal y muestra "Este campo es obligatorio" bajo cada incompleto, con color `--color-accent-edit`; al completar el campo el mensaje desaparece.
  - Evidencia: click en "Enviar invitación" vacío → `stillOpen: true` y 2 mensajes "Este campo es obligatorio" en `rgb(197, 80, 58)` (`#C5503A` = `--color-accent-edit`); al tipear, el mensaje por campo desaparece (caso Valeria: nombre sin error y email con error en simultáneo, `nameErrorGone: true`).
- [x] Enviar con un email con formato inválido (sin `@` o sin dominio) muestra "Ingresa un email válido" bajo EMAIL y el modal no se cierra.
  - Evidencia: EMAIL "valeria-munoz" + submit → `invalidMsg: "Ingresa un email válido"`, `modalStillOpen: true`; captura `.playwright-mcp/06-verify-invalid-email.png`.
- [x] Enviar con datos válidos cierra el modal y la primera fila de "PADRES VINCULADOS" es la nueva: nombre tal cual, subtexto `{relation} · {email}`, avatar con inicial y color derivado (^nextId % 2), badge PENDIENTE.
  - Evidencia: guardado con chip "Papá" → `modalClosedAfterSave: true`, primera fila `Valeria Muñoz / Papá · valeria@ejemplo.com / PENDIENTE` con avatar `bg-avatar-purple` (nextId 3, impar → purple; la 2ª invitación del paso 4 salió azul con id 4 — alternancia ✓); captura `.playwright-mcp/06-verify-saved-row.png` (fila indistinguible en formato de las mock).
- [x] X del header, overlay y `Esc` cierran sin agregar nada; al reabrir, el form está vacío, "Mamá" activo y un código nuevo.
  - Evidencia: `closedByX / closedByOverlay / closedByEsc: true` (los tres); al reabrir: `nameValue/emailValue: ""`, `mamaActive: true` y código nuevo (`J7EDB` → `GDBJ4`); ninguna fila agregada en ningún cierre.
- [x] Recargar el perfil vuelve al mock del niño (sin persistencia de la fila).
  - Evidencia: tras los guardados de la sesión (Valeria/Ana), `page.reload()` → `rowsAfterReload: 2` (mock de Mateo) y `inviteGone: true`.
- [x] A 375px el modal es usable: card a ancho completo, campos visibles con scroll, enviar y cerrar operativos.
  - Evidencia: `cardBox = { x: 16, width: 343.3 }` (viewport 375 → ancho completo con el padding 16 del overlay); capturas `.playwright-mcp/06-verify-modal-375-top.png` y `06-verify-modal-375-bottom.png` (scroll hasta código/botón); `Esc` cierra (`closedByEsc: true`) y un guardado válido a 375px antepuso a "Ana Beltrán · Mamá · ana@ejemplo.com" con badge PENDIENTE (captura `06-verify-375-profile-saved.png`).

## Decisiones tomadas y descartadas

- **Modal flotante sobre el perfil** (usuario: "modal") vs página/ruta dedicada: el mockup es una card centrada; sin ruta nueva no se toca `generateStaticParams` ni el sidebar.
- **Abrir solo desde el perfil del niño** (confirmado): es el único trigger que existe en los mockups; botones en otros lados serían inventados.
- **Enviar antepone fila PENDIENTE** (confirmado) vs solo cerrar: el flujo "enviar invitación" que no deja rastro no completa su trabajo; patrón mock-first de SPEC 05.
- **Validación inline custom** (confirmado) vs HTML5 nativo: mensajes alineados al estilo visual y coherentes con SPEC 05 ("Este campo es obligatorio" + variante de email).
- **"Mamá" preseleccionado** (confirmado; el mockup lo muestra activo): nunca hay estado vacío y el chip no lleva validación.
- **Código random de 5 chars por apertura** (confirmado) vs fijo `7K4P9` o expiración real: el fijo chocaría contra el criterio "regenera en cada apertura"; la expiración real agrega un timer sin UI que lo necesite. Alfabeto sin 0/O/1/I/L para evitar lecturas ambiguas.
- **"Vence en 7 días" como texto fijo** (confirmado): sin expiración funcional ni estado en otra parte.
- **Implementación: el banner usa el primer nombre del niño** ("Solo verá el feed de Mateo."), igual que el mockup; el subtítulo del header usa el nombre completo ("a Mateo Fernández"). Ambos interpolan desde `kid` del perfil.
- **`note` = email y `relation` = parentesco** (confirmado) en la fila: reutiliza el formato existente `relation · note` de las filas mock sin inventar props.
- **Reutilizar `LinkedParent`** (confirmado): no hay campos nuevos; `avatarColor` solo tiene `"blue" | "purple"` y alterna por `nextId % 2`.
- **Implementación: `nextId` sobre las filas actuales** (Verificador, 4 nov 2026) vs "máximo de los `parents` del mock + 1" (modelo de datos): con el cálculo estricto del mock, la 2ª invitación reusaría el `id` 3 (keys de React duplicadas y color sin alternancia). El cálculo corre sobre `rows` (mock + agregadas): la 1ª invitación sale `id` 3 = "mock max + 1" ✓ y las siguientes incrementan (`4`, `5`, …) manteniendo la alternancia `nextId % 2`. Verificado en la sesión (`bg-avatar-purple` con id 3, `bg-avatar-parent` con id 4).
- **Mudar el bloque PADRES VINCULADOS a un client component** (patrón SPEC 05): la página sigue server (`getKidById` + `cacheComponents`) y pasa `parents`/`kidName` como props serializables.
- **Descartado: abrir `mailto:` al enviar.** El mockup no lo muestra y complica la verificación con un popup del SO.
- **Descartado: persistencia localStorage** para la fila nueva: sería el primer estado persistente del proyecto; merece spec propia.
- **Limitaciones aceptadas:** sin focus trap completo, sin envío real de correo, el padre "invitado" no puede activarse desde el código mostrado (sin backend).

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                              |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Math.random()` para el código rompe la hidratación si se ejecuta en render inicial   | Generar el código solo al abrir el modal (handler/effect), nunca durante el render; validar con Context7. |
| Página server → client: props no serializables romperían con `cacheComponents`        | Pasar solo primitivos (`parents`, `kidName`); los derivados quedan inmutables (mock-first).               |
| Fidelidad por conversión inline-style → Tailwind (radios, paddings, sombra, gradiente)| Cubierta por captura Playwright vs mockup, como en SPEC 01/02/04/05.                                      |
| El alfabeto sin 0/1/O/I/L reduce combinaciones a 31^5 (~28.9 M): suficiente para mock   | Suficiente para mock-first; un backend real usaría su propio alfabeto/longitud (fuera de scope).          |

## Qué **no** está en esta spec

- Envío real de email / backend de invitaciones.
- Activación del padre con el código (SPEC 04 es el mock de ese flujo).
- Persistencia de los padres invitados.
- Edición/eliminación de padres vinculados.
- Trigger desde cualquier otra pantalla.
- Expiración real de la invitación.
- Modificación de `references/pantallas/`.
