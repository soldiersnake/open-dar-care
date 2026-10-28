# SPEC 01 — Feed como home `/`

**Estado:** Aprobado
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

- [ ] `/` renderiza sin errores y `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan.
- [ ] Fuentes Fredoka y Nunito cargan vía `next/font/google` (metadatos correctos).
- [ ] Colores exactos del mockup: fondo `#F6ECDF`, tarjetas `#FFFDF9` borde `#ECE0D0`, badges LOGRO verde `#CFEBD8`/`#3E9B6C`, ACTIVIDAD celeste `#C7E7F1`/`#2E89A6`, ANUNCIO azul `#CCD8F4`/`#4E72C8`, CTA gradient `#F4977E→#EE8164`.
- [ ] Sidebar de 248px fijo con nav de 4 ítems, "Feed" resaltado activo.
- [ ] Las 3 tarjetas muestran textos, horas, contadores (3/1, 5/2, 8/0) y placeholders idénticos al mockup.
- [ ] Ningún link navega fuera de `/` (todos inertes).
- [ ] A 1280px la captura de `/` coincide visualmente con el mockup (sin top bar ni hamburguesa).
- [ ] A 375px: no se ve el sidebar fijo; aparece top bar con logo + ☰.
- [ ] El hamburguesa abre el drawer con overlay; tapar overlay o elegir ítem lo cierra.
- [ ] El drawer muestra CTA, nav (Feed activo) y usuario.
- [ ] El feed sigue siendo scrolleable y legible en 375px.

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
