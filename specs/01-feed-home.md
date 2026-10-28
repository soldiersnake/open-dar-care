# SPEC 01 — Feed como home `/`

**Estado:** Aprobado — Verificado ✅ por Verificador (spec-verifier), 29 oct 2026
**Fecha:** 28 oct 2026
**Depende de:** ninguna

**Objetivo:** Implementar la pantalla del mockup `references/pantallas/feed.dc.html` como home `/` del app, visualmente idéntica y responsive, con datos mock hardcodeados, sin autenticación ni base de datos.

## Alcance

**Incluye:**

- Layout con sidebar fijo (248px) + feed de tarjetas de publicaciones.
- Fuentes Fredoka (títulos) y Nunito (texto) vía `next/font/google`.
- Tokens de color exactos del mockup en `app/globals.css` (theme CSS-first de Tailwind v4).
- 3 tarjetas: LOGRO (3 ♥ / 1 💬), ACTIVIDAD con placeholder de foto (5 ♥ / 2 💬) y ANUNCIO (8 ♥ / 0 💬), con badges de categoría.
- Header de bienvenida (GUARDERÍA · SALA SOLES / Buenas, Caro / 12 niños · martes 17 jun).
- CTA "Compartí un momento…" y botón "Nueva publicación" en el sidebar.
- Diseño responsive: `< 768px` (breakpoint `md` de Tailwind) el sidebar se reemplaza por una top bar fija (logo OpenDayCare/Sala Soles + botón hamburguesa ☰ a la derecha) que abre un drawer lateral con overlay; cierra al elegir opción o tocar el overlay.
- `≥ 768px`: layout desktop idéntico al mockup (sidebar fijo de 248px).

**No incluye (diferido a otras specs):**

- Autenticación, logout funcional, o cualquier lógica de datos.
- Rutas de destino de los links (crear-publicacion, ninos, avisos, mi-cuenta, detalle-publicacion, login): quedan como placeholders inertes (elementos clickeables con `href="#"`).
- Interactividad real (likes, comentarios, edición, scroll infinito).
- Otras pantallas del mockup.

## Estructura de archivos

```
components/
  shared/
    sidebar.tsx        → nav + drawer hamburguesa (reusable entre pantallas)
  home/
    post-card.tsx      → tarjeta de publicación (propia del home)
lib/
  feed-data.ts         → posts, nav items y usuario mock
app/
  layout.tsx          → fuentes Fredoka/Nunito
  globals.css         → tokens de color del mockup
  page.tsx            → composición del home
```

- `shared/`: elementos comunes a varias pantallas (sidebar/nav hoy; mañana botones, badges, inputs reutilizables).
- `home/`: componentes propios del home/feed.
- Los archivos nacen ya en su subcarpeta correspondiente; no se crean carpetas vacías.

## Modelo de datos

Mock tipado en `lib/feed-data.ts` (sin persistencia):

```ts
// Los valores en UI quedan en español; identificadores y valores de código en inglés
type Category = "achievement" | "activity" | "announcement";
type Post = {
  id: string;
  authorInitials: string; // "M" | anuncio usa ícono megáfono
  name: string; // renderiza "Mateo" | "Anuncio general"
  time: string; // renderiza "14:20"
  postedBy: string; // renderiza "publicado por vos"
  category: Category; // determina badge (achievement/activity/announcement)
  recipients: string; // renderiza "familia de Mateo" | "toda la sala"
  text: string;
  photoCaption?: string; // solo ACTIVITY: placeholder dashed "Foto · pintando con témperas"
  likes: number;
  comments: number;
};

type NavItem = {
  label: string; // renderiza en español ("Feed", "Niños", "Avisos", "Mi cuenta")
  icon: "feed" | "kids" | "notices" | "account";
  active?: boolean;
};
```

Más el usuario mock fijo: `Caro Giménez · Maestra · Soles`, sesión circular `C`.

## UX y estados

- Móvil (`< 768px`): estado cerrado (default), estado abierto (drawer `#FFFDF9` deslizando desde la izquierda con overlay oscurecido), nunca ambos.
- El drawer muestra: CTA "Nueva publicación", los 4 ítems de nav (Feed activo) y el bloque de usuario al final.
- El contenido del feed (header bienvenida, CTA, tarjetas) fluye debajo de la top bar sin obstacle; max-width 760px se mantiene.
- Desktop (`≥ 768px`): sidebar fijo de 248px, scroll solo en el main.

## Plan de implementación

1. **Layout y tokens:** reemplazar Geist por Fredoka/Nunito en `app/layout.tsx` (`next/font/google`, variables CSS); definir colores del mockup en `@theme` de `app/globals.css` (fondo `#F6ECDF`, panel `#FFFDF9`, borde `#ECE0D0`, tinta `#3F362E`, sec. `#6E6359`/`#A89A8B`/`#94887B`, acento `#D9583C`).
2. **Sidebar:** `components/shared/sidebar.tsx` como **Client Component** (`"use client"`): renderiza el sidebar desktop (`md:` visible), y en `<md` la top bar con botón ☰ + drawer; estado `useState` para abierto/cerrado, overlay que cierra al click.
3. **Post card:** `components/home/post-card.tsx` (header avatar+título+badge, destinatario, texto, foto placeholder opcional, action bar con ♥/💬/Editar).
4. **Datos:** `lib/feed-data.ts` con el array de 3 posts, ítems de nav y usuario mock.
5. **Página:** reescribir `app/page.tsx` como home: composición sidebar + main (header bienvenida, CTA "Compartí un momento…", separador PUBLICADO HOY, lista de post-cards).
6. **Verificación:** `npm run build`, `npx tsc --noEmit`, `npm run lint`; comparación visual con capturas de `/` en 2 tamaños — **1280px** (desktop idéntico al mockup) y **375px** (móvil: top bar, drawer abierto/cerrado) — guardadas en `.playwright-mcp/`.

## Criterios de aceptación

- [x] `/` renderiza sin errores y `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan.
  `next build` ✓ (Compiled successfully, rutas `/` y `/_not-found` estáticas), `tsc --noEmit` exit 0, `eslint` exit 0 (tras ignorar `references/**` en `eslint.config.mjs`).
  Playwright: 0 errores / 0 warnings de consola en `/`.
- [x] Fuentes Fredoka y Nunito cargan vía `next/font/google` (metadatos correctos).
  `app/layout.tsx` usa `Fredoka({variable:"--font-fredoka"})` + `Nunito({variable:"--font-nunito"})` aplicadas a `<html>` — patrón de `docs/01-app/03-api-reference/02-components/font.mdx` ("Using next/font with Tailwind CSS variables in App Router layout", v16.4.2 vía Context7).
  Computed styles en navegador: body `Nunito, "Nunito Fallback"…`, h1 `Fredoka, "Fredoka Fallback"…`.
- [x] Colores exactos del mockup: fondo `#F6ECDF`, tarjetas `#FFFDF9` borde `#ECE0D0`, badges LOGRO verde `#CFEBD8`/`#3E9B6C`, ACTIVIDAD celeste `#C7E7F1`/`#2E89A6`, ANUNCIO azul `#CCD8F4`/`#4E72C8`, CTA gradient `#F4977E→#EE8164`.
  Tokens en `@theme` de `app/globals.css` + computed styles verificados en 1280px: body rgb(246,236,223), card rgb(255,253,249)/rgb(236,224,208), badges rgb(207,235,216)/rgb(62,155,108), rgb(199,231,241)/rgb(46,137,166), rgb(204,216,244)/rgb(78,114,200), gradiente `linear-gradient(rgb(244,151,126), rgb(238,129,100))`.
- [x] Sidebar de 248px fijo con nav de 4 ítems, "Feed" resaltado activo.
  `aside` ancho `248px` (getBoundingClientRect), 4 links (Feed/Niños/Avisos/Mi cuenta), "Feed" activo rgb(217,88,60) sobre rgb(251,227,216). Fondo panel rgb(255,253,249).
- [x] Las 3 tarjetas muestran textos, horas, contadores (3/1, 5/2, 8/0) y placeholders idénticos al mockup.
  A11y snapshot (`.playwright-mcp/verify-drawer-open.yml`): Mateo 14:20 3♥/1💬, Mateo 09:40 5♥/2💬 + "Foto · pintando con témperas" (dashed), Anuncio general 07:50 8♥/0💬, textos completos.
- [x] Ningún link navega fuera de `/` (todos inertes).
  Clicks en CTA "Compartí un momento…", "Editar" y comentario: `location.pathname` sigue siendo `"/"` tras cada click; todos los links usan `href="#"` (verificado en sidebar.tsx/post-card.tsx/page.tsx).
- [x] A 1280px la captura de `/` coincide visualmente con el mockup (sin top bar ni hamburguesa).
  `.playwright-mcp/verify-feed-desktop-1280-full.png` vs `references/screenshots/feed.png` + `references/pantallas/feed.dc.html`: layout, badges, CTA, separador y colores pares; `header` con `display:none` computado en desktop. Corazón de likes con `fill #E0654A` coincide con el `.dc.html` (`fill="#E0654A"`).
- [x] A 375px: no se ve el sidebar fijo; aparece top bar con logo + ☰.
  `.playwright-mcp/verify-feed-mobile-375-closed.png`: top bar con logo OpenDayCare/Sala Soles y botón ☰ a la derecha; `aside` oculto por `hidden md:flex`.
- [x] El hamburguesa abre el drawer con overlay; tapar overlay o elegir ítem lo cierra.
  Click ☰ → drawer `translate-x-0` (captura `verify-feed-mobile-375-drawer-open.png`); click en overlay (x=320) → drawer vuelve a `-translate-x-full`; click en "Niños" en el drawer → estado `CLOSED` verificado.
- [x] El drawer muestra CTA, nav (Feed activo) y usuario.
  `.playwright-mcp/verify-drawer-open.yml`: CTA "Nueva publicación", nav con 4 ítems ("Feed" activo), bloque "Caro Giménez · Maestra · Soles" al final.
- [x] El feed sigue siendo scrolleable y legible en 375px.
  `scrollHeight: 1525px` con scroll funcionando (scrollTop 712px); captura `.playwright-mcp/verify-feed-mobile-375-scrolled.png` muestra tarjetas legibles bajo la top bar.

## Decisiones tomadas

- **Mock tipado en archivo separado** vs markup estático: estructura reutilizable para specs futuras al conectar datos reales.
- **Links inertes** vs rutas 404: cada pantalla pendiente tendrá su propia spec; nada debe romperse al hacer click.
- **Tailwind con tokens exactos** vs inline styles copiados: idioma del proyecto ya es Tailwind v4 CSS-first; fidelidad garantizada con los valores exactos en `@theme`.
- **Breakpoint 768px** (md de Tailwind): el sidebar de 248px ocupa demasiado en pantallas chicas.
- **Top bar + drawer con overlay:** el ícono ☰ siempre visible y accesible en móvil, sin ambigüedad sobre cómo abrir/cerrar.
- **Drawer con React (`useState`, Client Component)** vs hack CSS: el estado es simple y se mantiene con menos sutileza que un peer/checker hack; solo el sidebar es client, el resto sigue Server Component.
- **`components/` en raíz con subcarpetas por dominio (`shared/`, `home/`)** vs estructura plana: mantiene la organización de contenido interno visible cuando el proyecto crezca con nuevas pantallas.

## Riesgos

- Fredoka/Nunito vía `next/font/google` requiere red al buildear; si falla, el fallback `system-ui` cambia levemente el look.
- La paridad "idéntica" depende de espaciados/`border-radius` precisos al convertir inline styles → Tailwind; se verifica por captura.
