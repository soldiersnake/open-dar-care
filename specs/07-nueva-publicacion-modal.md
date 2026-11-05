# SPEC 07 — Modal "Nueva publicación" (crear-publicacion)

# SPEC 07 — Modal "Nueva publicación" (crear-publicacion)

> **Estado:** Implementado — Verificado ✅ por Verificador (spec-verifier), 5 nov 2026
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-05
> **Objetivo:** Implementar el modal del mockup `references/pantallas/crear-publicacion.dc.html`, que se abre desde los 3 triggers de "Nueva publicación" (sidebar, drawer móvil y CTA "Compartí un momento…" del feed), con chips multi-selección de niños (con "Toda la sala" como toggle de todos), multi-selección obligatoria de tipo, descripción obligatoria con validación inline, fotos locales opcionales, y al publicar antepone la publicación en el feed (client-side), navega a `/` si hace falta y muestra un toast de éxito.

## Alcance

**Incluye:**

- Modal (overlay oscurecido + card flotante fiel al mockup, max-width 580px) sobre cualquier página con sidebar:
  - Header: "Cancelar" (izquierda, `#94887B` bold 15px), título "Nueva publicación" (Fredoka 600 18px, `#3F362E`) y "Publicar" (derecha, `#D9583C` bold 800 15px), separados por borde inferior `#ECE0D0`.
  - Labels eyebrow (12px, 800, letter-spacing 0.7px, `#94887B`, uppercase): `PARA`, `TIPO`, `DESCRIPCIÓN`, `FOTOS`.
  - `PARA`: chips pill multi-selección con los 8 niños del mock de SPEC 02 (avatar circular con inicial + color del niño como el mockup: `background` pastel de avatar, letra Fredoka 600 13px) + chip "Toda la sala" al final. Chip seleccionado: borde 1.5px `#3F362E`, fondo `#3F362E`, texto blanco; deseleccionado: borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359`.
    - "Toda la sala" es un **toggle global**: si no están todos seleccionados, lo selecciona a todos; si ya están todos, los deselecciona todos.
    - Se puede elegir 1 o N niños sin pasar por "Toda la sala".
  - `TIPO`: 7 chips multi-selección con los estilos exactos del mockup (Comida `#9A7B1E`, Siesta `#E7DCF6/#7B5FC0`, Actividad `#2E89A6`, Logro `#CFEBD8/#3E9B6C`, Ánimo `#F9D2DE/#C56486`, Foto `#FBD8CC/#D9684A`, Anuncio `#CCD8F4/#4E72C8`). **Sin default**: abre con los 7 desactivados. Seleccionado = estilo activo del mockup; deseleccionado = pill neutra (borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359`).
  - `DESCRIPCIÓN`: textarea (min-height 120px, radio 14px, borde 1.5px `#EADFD0`, fondo blanco, placeholder "Contá cómo le fue hoy…").
  - `FOTOS`: tile `Agregar` punteado (96×96, borde dashed `#DBCDBA`, ícono + `#C5503A`, texto "Agregar") que abre el file picker (`<input type="file" accept="image/*" multiple>`); cada imagen elegida se muestra como miniatura 96×96 (object URL local, sin subir nada) con X para quitarla.
  - Estilos de card: fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`.
- Validación inline al pulsar "Publicar": con PARA vacío → "Elegí al menos un niño"; con TIPO vacío → "Elegí al menos un tipo"; con descripción vacía → "Este campo es obligatorio" (mismo tratamiento de SPEC 05/06: color `--color-accent-edit`, desaparecen al corregir). Con errores el modal **no se cierra**.
- Cierre del modal: "Cancelar", click en overlay y tecla `Esc`; en los tres casos nada se publica y al reabrir el form arranca vacío.
- Publicar con datos válidos (los 3 triggers): cierra el modal, antepone la publicación nueva en el feed (estado client-side vía provider; sin persistencia), **navega a `/`** si el usuario no estaba en el feed, y muestra toast de éxito.
- Toast reutilizable: fixed bottom-center, auto-cierra a los ~3s, una sola vez por publicación, con variantes **success/error/warning** listas (por ahora solo se dispara success).
- Datos derivados del post nuevo (mock-first, indistinguible de los mock): `time` = hora actual "HH:MM", `postedBy` = "publicado por vos", `likes` = 0, `comments` = 0, badge del primer tipo seleccionado (orden del mockup).
- Responsive: modal usable a 375px (card a ancho completo, scroll si el alto no alcanza) y fiel al mockup a 1280px.
- Los 3 triggers pasan de `<a href="#">`/link a `<button>` real, con la misma apariencia (gradiente sidebar/drawer; CTA "Compartí un momento…" del feed).

**No incluye (diferido a otras specs):**

- Persistencia (localStorage/backend): las publicaciones creadas viven solo en memoria client-side.
- Subida real de fotos: solo se previsualizan localmente (object URL).
- Toast error/warning disparados por flujos reales (la infra quedó lista).
- Edición o eliminación de publicaciones existentes (los "Editar" de los mockups quedan inertes, como hoy).
- Pantalla separada `/crear-publicacion` (el mockup se implementó como modal, decisión del usuario).
- Notificaciones reales a familias (el post es decorativo para la familia).
- Focus trap / restore de foco a11y completo.
- Modificar los archivos de `references/pantallas/`.

## Estructura de archivos

```
lib/
  feed-data.ts                  → MODIFICADO: agrega POST_TYPES, TYPE_TO_CATEGORY,
                                    PostDraft, createPostFromForm()
app/(app)/
  layout.tsx                    → MODIFICADO: envuelve children en <NewPostProvider>
  page.tsx                      → MODIFICADO: queda solo <FeedScreen/>
components/
  home/
    feed-screen.tsx             → NUEVO ("use client"): dueño del feed (mock + posts nuevos
                                    del context), CTA "Compartí un momento…" como trigger
  shared/
    new-post-provider.tsx       → NUEVO ("use client"): context con newPosts, addPost() y
                                    showToast(); permite publicar desde /kids y aterrizar en /
    create-post-modal.tsx       → NUEVO ("use client"): overlay + card + para/tipo/desc/fotos
    new-post-launcher.tsx       → NUEVO ("use client"): render-prop launcher compartido por
                                    los 3 triggers; on save → addPost + toast + navigate "/"
    toast.tsx                   → NUEVO ("use client"): Toast fixed bottom-center con variantes
    sidebar.tsx                 → MODIFICADO: NewPostButton pasa a <button> y monta el modal
                                  (sirve para sidebar y drawer con el mismo handler)
```

`PostCard` (`components/home/post-card.tsx`) no cambia: el post nuevo es un `Post` válido del modelo de SPEC 01.

## Modelo de datos

`lib/feed-data.ts` agrega:

```ts
// Tipos del modal (orden del mockup); el primero seleccionado define el badge
export const POST_TYPES = ["Comida", "Siesta", "Actividad", "Logro", "Ánimo", "Foto", "Anuncio"] as const;

// Mapeo al Category existente del feed (achievement | activity | announcement)
export const TYPE_TO_CATEGORY: Record<(typeof POST_TYPES)[number], Category>;

// Draft = lo que llena el modal
export type PostDraft = {
  kidNames: string[];        // = [] si "Toda la sala"
  wholeRoom: boolean;        // chip "Toda la sala" activo
  types: (typeof POST_TYPES)[number][]; // en el orden elegido
  text: string;
  photoCount: number;        // cant. de fotos locales elegidas
};

export function createPostFromForm(draft: PostDraft, existingCount: number): Post;
```

Reglas de derivación de `createPostFromForm` (patrón de SPEC 05):

- `id`: `post-nueva-${existingCount + 1}`.
- Selección específica de 1 niño: `name` = el niño, `authorInitials` = su inicial, `recipients` = "familia de {niño}".
- N niños (2+): `name` = primer niño, su inicial, `recipients` = "familias de {n} niños".
- "Toda la sala": `name` = "Anuncio general", `authorInitials` = `""` (megáfono, como el post mock), `recipients` = "toda la sala".
- `category`: `TYPE_TO_CATEGORY[types[0]]` (Logro→achievement, Actividad/Foto→activity, Anuncio→announcement; los demás→activity).
- `text`: descripción tal cual.
- `photoCaption`: solo si `photoCount > 0` → "Foto · {n} imagen/es".
- `time`: hora del momento del guardado "HH:MM" (solo corre en el handler de Publicar, nunca en el render inicial — guard de hidratación aplicado desde SPEC 05).

La lista visible en `/` es `[...newPosts del provider, ...posts del mock]`.

## UX y estados

- Sin modal: las páginas se ven exactamente como hoy.
- Modal abierto: overlay `rgba(63,54,46,0.45)`, card centrada, scroll de página bloqueado; form vacío (7 tipos inactivos, sin niños, descripción vacía, sin fotos).
- Publicar válido: modal cerrado, post nuevo **primero** en el feed, toast "Publicación creada" (bottom-center, ~3s); si el usuario estaba en `/kids` (u otra página), aterriza en `/` con el post ya visible.
- Publicar inválido: modal abierto con los mensajes inline; no se navega ni se agrega nada.
- Cancelar / overlay / `Esc`: cerrar sin guardar; al reabrir el form arranca vacío.
- 375px: card a ancho completo con padding 16px y scroll interno si hace falta.

## Plan de implementación

1. `lib/feed-data.ts`: `POST_TYPES`, `TYPE_TO_CATEGORY`, `PostDraft` y `createPostFromForm()`. Sin cambios visuales. Manual: `npx tsc --noEmit` y el feed igual que antes.
2. `components/shared/toast.tsx`: componente Toast (success/error/warning) con auto-dismiss. Sin uso real todavía. Manual: tsc/lint pasan.
3. `components/shared/new-post-provider.tsx`: context con `newPosts`, `addPost()`, `showToast()`; se monta en `app/(app)/layout.tsx`. Manual: tsc/lint pasan, sin cambios visuales.
4. `components/shared/create-post-modal.tsx`: overlay + card fiel al mockup, chips PARA (kids de `lib/kids-data.ts` + "Toda la sala" toggle), chips TIPO multi-selección sin default, textarea, tiles de FOTOS (file picker + quitar), cierre por Cancelar/overlay/Esc; Publicar aún sin validación ni guardado. Manual: abrir/cerrar como el mockup a 1280px y 375px.
5. Validación + guardado: mensajes inline con limpieza al corregir; si es válido, `createPostFromForm` + `addPost` + navegación a `/` + toast success. Manual: guardar vacío no cierra; válido antepone el post (desde `/` y desde `/kids`).
6. Wire de triggers: `sidebar.tsx` (botón real, sidebar + drawer) y `feed-screen.tsx` (CTA); `page.tsx` queda `<FeedScreen/>`. Manual: los 3 triggers abren el modal; feed sin regresiones.
7. Verificación (spec-verifier): `npm run build`, `npx tsc --noEmit`, `npm run lint`, Context7 si Next.js 16.4.2 lo requiere, y paridad visual con Playwright a 1280px y 375px contra `crear-publicacion.dc.html` servido por HTTP (modal abierto, errores de validación, post publicado + toast). Capturas en `.playwright-mcp/`.

## Criterios de aceptación

> Verificación completa (Verificador, 5 nov 2026): `npm run build` OK (Turbopack
> "Compiled successfully", Cache Components + Partial Prefetching activos, 16/16
> rutas prerenderizadas con `○ /` estático), `npx tsc --noEmit` exit 0 y
> `npm run lint` exit 0. Sesión Playwright completa contra el dev server propio
> (capturas en `.playwright-mcp/07-*.png`): **0 errores / 0 warnings** en consola
> durante toda la sesión (modal cerrado, abierto, con errores de validación,
> tras publicar — desktop y móvil). Context7 `/vercel/next.js`:
> `io.mdx` ("Non-deterministic values") — `new Date()` corre en el handler de
> Publicar dentro del navegador, contexto en el que la regla de prerender no
> aplica ("In every other context (… the browser …) it resolves immediately");
> `05-server-and-client-components.mdx` ("Context providers") — montar el
> provider client envolviendo `{children}` desde un server layout es el patrón
> oficial que sigue `NewPostProvider` en `app/(app)/layout.tsx`.

- [x] `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan; consola 0 errores/0 warnings con el modal cerrado, abierto, con errores de validación y tras publicar.
  - Evidencia (Verificador, 5 nov 2026): build OK (16/16, `○ /` estático con Cache Components + Partial Prefetching), tsc/lint sin output; auditoría Playwright de consola en la sesión completa (`browser_console_messages` error/warning = 0 y 0, solo logs de DevTools).
- [x] Los 3 triggers (sidebar/desktop, drawer móvil, CTA "Compartí un momento…") son `<button>` reales con `aria-haspopup="dialog"` que abren el modal, con la apariencia intacta.
  - Evidencia: evaluate — sidebar `BUTTON` + `aria-haspopup="dialog"` + `linear-gradient` intacto; drawer a 375px `BUTTON` + `dialog` y abre; CTA `BUTTON` + `dialog`, abre post-flush y `Esc` cierra (`components/shared/sidebar.tsx`, `feed-screen.tsx` → `NewPostLauncher`).
- [x] A 1280px el modal es visualmente fiel a `crear-publicacion.dc.html`: header "Cancelar / Nueva publicación / Publicar", labels eyebrow, estilos de chips/textarea/card y placeholder exactos.
  - Evidencia: comparación por visión de `.playwright-mcp/07-modal-1280.png` vs `.playwright-mcp/07-mockup-crear-publicacion-1280.png` (mockup servido por HTTP en :8899) — card `#FBF4EC`/`#ECE0D0`/r24, header con "Publicar" `#D9583C`, labels eyebrow 12px tracking, chips PARA con avatares pastel + dark chip activo idéntico al de "Mateo" del mockup, 7 TIPOs con la paleta exacta, placeholder "Contá cómo le fue hoy…". Diferencias únicas = decisiones de spec (overlay del modal real, sin default, 8 niños en vez de 3, sin foto precargada).
- [x] `PARA` muestra los 8 niños del mock + "Toda la sala": multi-selección individual, chip activo con estilo del mockup; "Toda la sala" selecciona todos cuando falta alguno y deselecciona todos cuando están todos.
  - Evidencia: evaluate — chips activos `border-color rgb(63,54,46)`/bg `#3F362E` al elegir; "Toda la sala" 1er click → 8 niños activos y chip activo (captura `.playwright-mcp/07-modal-375-fixed.png`); 2do click → 0 seleccionados; publicó "familias de N niños" correspondiente.
- [x] `TIPO` abre sin ningún chip activo y permite multi-selección (Comida + Logro a la vez, por ejemplo).
  - Evidencia: formulario fresco con Comida/Logro/Anuncio neutros al abrir; tras clicks Comida `#9A7B1E` + Logro `#CFEBD8/#3E9B6C` activos en simultáneo y Siesta sigue neutra (`TYPE_STYLES` en `create-post-modal.tsx`).
- [x] Publicar con PARA, TIPO o descripción incompletos NO cierra el modal y muestra los mensajes inline con color `--color-accent-edit`; los mensajes desaparecen al corregir.
  - Evidencia: submit vacío → modal sigue abierto; al corregir los mensajes desaparecen por campo (la publicación válida pasa directamente); captura `.playwright-mcp/07-validation.png`; color de mensajes `rgb(197, 80, 58)` = `--color-accent-edit`.
- [x] FOTOS: "Agregar" abre el file picker y la/s imagen/es elegida/s aparecen como miniatura 96×96 con X para quitar; nada se sube.
  - Evidencia: `browser_file_upload` → 1 miniatura (96×96) con botón `aria-label^="Quitar"`; remove → 0 thumbs y tile "Agregar" vuelve; `URL.createObjectURL` local (sin red) con revoke al quitar/desmontar.
- [x] Publicar con datos válidos antepone el post en el feed con datos derivados (hora real, badge del primer tipo, recipients según selección, 0 likes/comentarios) y "publicado por vos".
  - Evidencia: caption "Anuncio general · 15:55 · publicado por vos · ACTIVIDAD · toda la sala · 0" y "familias de 2 niños" (captura `.playwright-mcp/07-post-2-kids-toast.png`) — `createPostFromForm` con `TYPE_TO_CATEGORY` sobre el primer tipo, `formatTime` solo en el handler.
- [x] Publicar desde `/kids` cierra el modal, navega a `/` y el post nuevo aparece primero; desde `/` antepone en el sitio.
  - Evidencia: publicar con "Sofía Méndez" + Actividad desde `/kids` → URL pasa a `/`, modal cerrado y primera card "Sofía Méndez · familia de Sofía Méndez"; desde `/` antepone en el lugar (`NewPostLauncher.handlePublish` con `router.push("/")`).
- [x] Publicar muestra un toast bottom-center que solo desaparece a los ~3s (variantes error/warning compilan pero no se disparan por hoy).
  - Evidencia: tras publicar, toast `fixed bottom-24px left-1/2 "Publicación creada"` (captura `.playwright-mcp/07-post-2-kids-toast.png`) y `browser_wait_for(textGone)` lo confirma desaparecido dentro de 3,5s (`setTimeout(onClose, 3000)`); variantes error/warning con checkstyle en `components/shared/toast.tsx` y llaman `showToast(msg, "error"|"warning")` sin disparos hoy.
- [x] "Cancelar", overlay y `Esc` cierran sin publicar; al reabrir el form está vacío.
  - Evidencia: los tres cierran el modal y las cards permanecen en 3; al reabrir (tras Esc) el form llega limpio: tipos inactivos, 0 niños, textarea vacía, 0 errores.
- [x] Recargar el feed vuelve al mock de 3 posts (sin persistencia).
  - Evidencia: tras publicaciones de la sesión (Sofía + verificación "familias de 2 niños"), `browser_navigate` a `/` → exactamente 3 cards (mock de SPEC 01).
- [x] A 375px el modal es usable: card a ancho completo, scroll, publicar y cerrar operativos.
  - Evidencia: card ≤333px (viewport 375 − padding 16 − scrollbar) y scrolleable con publicar/Esc funcionales (capturas `.playwright-mcp/07-modal-375-top.png` y `07-modal-375-fixed.png`); fix aplicado durante la verificación — el drawer usa CSS transform que crea un containing block para overlays `fixed`, el modal ahora se monta vía `createPortal(→ document.body)` en `new-post-launcher.tsx` y el overlay vuelve a ancho completo (antes 279px).

## Decisiones tomadas y descartadas

- **Modal flotante** (usuario: "modal") vs página `/crear-publicacion`: el mockup es una card; sin ruta nueva no se toca el prerender ni el sidebar.
- **Abrir desde los 3 triggers** (confirmado): sidebar, drawer y CTA del feed enlazan al mockup; es una sola apariencia del mismo botón.
- **TIPO multi-selección sin default** (confirmado): el activo del mockup ilustraba el estilo; obligatorio elegir al menos 1.
- **PARA: los 8 niños del mock de SPEC 02** (confirmado): el mockup muestra 3 solo por compactación; toggle "Toda la sala" = seleccionar/deseleccionar todos (confirmado); se permite 1 o N niños (confirmado).
- **Publicar antepone + toast de éxito** (confirmado) con variantes error/warning preparadas (confirmado): patrón mock-first de SPEC 05/06 + feedback explícito del usuario.
- **Navegación a `/` al publicar desde otra página**: el estado de publicaciones vive en un provider client del layout; sin él, el post publicado desde `/kids` se perdería al volver al feed (el re-render reparte desde el mock).
- **Badge del post = primer tipo seleccionado** (orden del mockup, confirmado el mapeo): reutiliza las 3 categorías visuales existentes de SPEC 01 sin diseñar cards nuevas.
- **Validación inline custom** (confirmado) vs HTML5 nativo: mismo tratamiento de SPEC 05/06.
- **Implementación: el modal se monta vía `createPortal` a `document.body`** (Verificador, 5 nov 2026): el drawer móvil anima con CSS transform y una transform crea un *containing block* para overlays `fixed`; sin portal, abrir desde el drawer recortaba el modal al ancho del drawer (279px a 375px). El launcher centraliza el portal y sirve igual a los 3 triggers.
- **Fotos: file picker local + quitar** (confirmado), sin upload ni feed que muestre la imagen (caption con contador).
- **Descartado: persistencia localStorage** para los posts: primer estado persistente del proyecto; spec propia si algún día se necesita.
- **Descartado: disparar toast error/warning en esta spec**: no existe hoy un flujo que los necesite; la API queda lista.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `new Date()` para la hora rompe la hidratación si corre en render inicial | `createPostFromForm` solo se ejecuta en el handler de Publicar; validar con Context7 igual que SPEC 05. |
| object URLs de fotos se pierden al recargar (mock-first) | Aceptado: sin persistencia, documentado en decisiones. |
| Fidelidad por conversión inline-style → Tailwind (sombras, pills, chips) | Cubierta por captura Playwright vs mockup, como en SPEC 05/06. |
| Provider client en el layout con `cacheComponents` | Props/estado serializables; validar con Context7 contra Next.js 16.4.2. |

## Qué **no** está en esta spec

- Persistencia de las publicaciones creadas.
- Subida real de fotos a ningún backend.
- Toast error/warning disparados por flujos reales.
- Edición/eliminación de posts existentes.
- Versión funcional de Avisos o "Mi cuenta".
- Modificación de `references/pantallas/`.
