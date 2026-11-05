# SPEC 07 — Modal "Nueva publicación" (crear-publicacion)

> **Estado:** Aprobado
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

- [ ] `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan; consola 0 errores/0 warnings con el modal cerrado, abierto, con errores de validación y tras publicar.
- [ ] Los 3 triggers (sidebar/desktop, drawer móvil, CTA "Compartí un momento…") son `<button>` reales con `aria-haspopup="dialog"` que abren el modal, con la apariencia intacta.
- [ ] A 1280px el modal es visualmente fiel a `crear-publicacion.dc.html`: header "Cancelar / Nueva publicación / Publicar", labels eyebrow, estilos de chips/textarea/card y placeholder exactos.
- [ ] `PARA` muestra los 8 niños del mock + "Toda la sala": multi-selección individual, chip activo con estilo del mockup; "Toda la sala" selecciona todos cuando falta alguno y deselecciona todos cuando están todos.
- [ ] `TIPO` abre sin ningún chip activo y permite multi-selección (Comida + Logro a la vez, por ejemplo).
- [ ] Publicar con PARA, TIPO o descripción incompletos NO cierra el modal y muestra los mensajes inline con color `--color-accent-edit`; los mensajes desaparecen al corregir.
- [ ] FOTOS: "Agregar" abre el file picker y la/s imagen/es elegida/s aparecen como miniatura 96×96 con X para quitar; nada se sube.
- [ ] Publicar con datos válidos antepone el post en el feed con datos derivados (hora real, badge del primer tipo, recipients según selección, 0 likes/comentarios) y "publicado por vos".
- [ ] Publicar desde `/kids` cierra el modal, navega a `/` y el post nuevo aparece primero; desde `/` antepone en el sitio.
- [ ] Publicar muestra un toast bottom-center que solo desaparece a los ~3s (variantes error/warning compilan pero no se disparan por hoy).
- [ ] "Cancelar", overlay y `Esc` cierran sin publicar; al reabrir el form está vacío.
- [ ] Recargar el feed vuelve al mock de 3 posts (sin persistencia).
- [ ] A 375px el modal es usable: card a ancho completo, scroll, publicar y cerrar operativos.

## Decisiones tomadas y descartadas

- **Modal flotante** (usuario: "modal") vs página `/crear-publicacion`: el mockup es una card; sin ruta nueva no se toca el prerender ni el sidebar.
- **Abrir desde los 3 triggers** (confirmado): sidebar, drawer y CTA del feed enlazan al mockup; es una sola apariencia del mismo botón.
- **TIPO multi-selección sin default** (confirmado): el activo del mockup ilustraba el estilo; obligatorio elegir al menos 1.
- **PARA: los 8 niños del mock de SPEC 02** (confirmado): el mockup muestra 3 solo por compactación; toggle "Toda la sala" = seleccionar/deseleccionar todos (confirmado); se permite 1 o N niños (confirmado).
- **Publicar antepone + toast de éxito** (confirmado) con variantes error/warning preparadas (confirmado): patrón mock-first de SPEC 05/06 + feedback explícito del usuario.
- **Navegación a `/` al publicar desde otra página**: el estado de publicaciones vive en un provider client del layout; sin él, el post publicado desde `/kids` se perdería al volver al feed (el re-render reparte desde el mock).
- **Badge del post = primer tipo seleccionado** (orden del mockup, confirmado el mapeo): reutiliza las 3 categorías visuales existentes de SPEC 01 sin diseñar cards nuevas.
- **Validación inline custom** (confirmado) vs HTML5 nativo: mismo tratamiento de SPEC 05/06.
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
