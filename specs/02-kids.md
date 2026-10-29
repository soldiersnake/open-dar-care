# SPEC 02 — Niños `/kids` y perfil `/kids/:id`

**Estado:** Aprobado
**Fecha:** 29 oct 2026
**Depende de:** SPEC 01

**Objetivo:** Implementar las pantallas de los mockups `references/pantallas/ninos.dc.html` (ruta `/kids`, lista con buscador funcional) y `references/pantallas/perfil-nino.dc.html` (ruta `/kids/[id]`, detalle por id numérico) visualmente idénticas y responsive, con datos mock, sin autenticación ni base de datos.

## Alcance

**Incluye:**

- `/kids` (lista):
  - Header "GESTIÓN / Niños" + botón "Agregar niño" (inerte, `href="#"`).
  - Buscador "Buscar niño…" con **filtro real client-side por nombre**; el separador muestra el contador dinámico ("SALA SOLES · N niños" según el filtro; estado vacío "Sin resultados para '…'" si no hay coincidencias).
  - Grid de tarjetas (`2` columnas desktop, `1` columna `< 768px`): avatar circular con letra y color de paleta, nombre, "X años · Y padres vinculados", y a la derecha badge de alergia (MANÍ / LACTOSA), badge "VINCULAR" (sin padres) o chevron `>`.
  - Hover de tarjeta (`border-color #F2A78E`, `translateY(-2px)`) y navegación a `/kids/:id` al hacer click.
- `/kids/[id]` (perfil):
  - Link "Volver a Niños" → `/kids`.
  - Hero: avatar 84px, nombre, "X años · Sala Soles", botón "Editar" (inerte).
  - Banner "Alergias y notas" (fondo `#FBDAD6`) solo si el niño tiene nota de alergia.
  - Card de datos: Fecha de nacimiento / Sala / Ingreso.
  - Columna derecha (300px): botón "Resumen del día" (inerte), card "PADRES VINCULADOS" (avatar + nombre + "Mamá/Papá · nota" + badge ACTIVA/PENDIENTE por padre) y link "Vincular otro padre" (inerte). Con 0 padres, la card muestra solo el link VINCULAR.
- Id **numérico**: `/kids/1` … `/kids/8`. Id inexistente → `notFound()` (página 404 de Next.js). `params` es Promise en Next.js 16 → se espera con `await` en el Server Component.
- Sidebar con navegación real: los `navItems` pasan a tener `href` (`/`, `/kids`, y `#` para Avisos/Mi cuenta) y el ítem activo se determina con `usePathname()` (Feed activo en `/`, Niños activo en `/kids` y en `/kids/:id`). El resto de links (Nueva publicación, cerrar sesión, logo) quedan inertes.
- Diseño responsive: `< 768px` (`md`) top bar + drawer que ya existen, grid y layout del perfil apilados; `≥ 768px` idéntico al mockup.
- Componentes reutilizables en `components/shared/` (avatar, badge, page-header, section-divider, info-list) usados por ambas páginas.

**No incluye (diferido a otras specs):**

- Pantallas "Agregar niño", "Editar", "Vincular padre", "Resumen del día": los links quedan inertes.
- Autenticación, persistencia o datos reales; la sala "Sala Soles" es la única.
- Interacción en buscador distinta del filtrado local (sin debounce server, sin paginación).
- Las 8 capturas de perfil fieles al mockup: solo Mateo (`/kids/1`) es fiel al mockup; el resto es mock coherente.

## Estructura de archivos

```
components/
  shared/
    sidebar.tsx          → MODIFICADO: hrefs reales + active por usePathname()
    avatar.tsx           → NUEVO: círculo con letra inicial (tamaño y color por props)
    badge.tsx            → NUEVO: pill (alergia alert, VINCULAR, ACTIVA, PENDIENTE)
    page-header.tsx      → NUEVO: eyebrow + título + slot de acción a la derecha
    section-divider.tsx  → NUEVO: separador con label, contador y línea
    info-list.tsx        → NUEVO: card de filas label/valor (datos del perfil)
  kids/
    kid-card.tsx         → NUEVO: tarjeta de la lista
    kid-list.tsx         → NUEVO: "use client" — buscador + grid filtrado
lib/
  kids-data.ts           → NUEVO: Kid, LinkedParent, los 8 niños mock + getKidById
app/
  kids/
    page.tsx             → NUEVO: composición lista /kids
    [id]/
      page.tsx           → NUEVO: composición perfil, `await params`, notFound()
```

## Modelo de datos

Mock tipado en `lib/kids-data.ts` (sin persistencia):

```ts
// Los valores en UI quedan en español; identificadores y valores de código en inglés
type ParentStatus = "active" | "pending";
type LinkedParent = {
  id: number;
  name: string; // renderiza "Lucía Fernández"
  relation: string; // renderiza "Mamá" | "Papá"
  status: ParentStatus; // determina badge ACTIVA | PENDIENTE
  avatarColor: "purple" | "blue"; // nota del padre en la card
  note: string; // renderiza "activa" | "invitación enviada"
};

type Kid = {
  id: number;
  name: string; // renderiza "Mateo Fernández"
  age: number; // renderiza "3 años"
  initials: string; // letra del avatar
  avatarColor: "sky" | "pink" | "green" | "yellow" | "purple"; // paleta compartida
  allergiesNote?: string; // banner: "Alergia al maní. Evitar frutos secos…"
  allergyTag?: string; // badge de lista: "MANÍ" | "LACTOSA"
  birthDate: string; // renderiza "12 mar 2022"
  room: string; // renderiza "Soles"
  entryDate: string; // renderiza "feb 2025"
  parents: LinkedParent[];
};
```

8 niños con los datos visibles del mockup de lista (Mateo: 3 años · 2 padres · MANÍ / Sofía: 2 · 1 / Benjamín: 3 · 2 / Valentina: 2 · 0 · VINCULAR / Tomás: 3 · 1 · LACTOSA / Emma: 2 · 1 / Lucas: 3 · 1 / Olivia: 2 · 1); el resto son detalles plausibles. Perfil de `/kids/1` = fiel a `perfil-nino.dc.html` (Mateo, mamá ACTIVA + papá PENDIENTE, alergia maní + inhalador, 12 mar 2022, feb 2025).

Paleta de avatares compartida (mockup): sky `#A9D9E8/#1F7A93`, pink `#F4B8CC/#C44A7A`, green `#B9DEC4/#3E8B62`, yellow `#F4DC8E/#9A7B1E`, purple `#C9B6E8/#7B5FC0`.

## UX y estados

- `/kids` con filtro vacío = mockup exacto (8 tarjetas). Con texto = subconjunto + contador y línea del separador intactos; sin coincidencias = mensaje vacío.
- Perfil: dos columnas (contenido flexible min 300px + columna fija 300px) que envuelven/apilan (`flex-wrap`) en pantallas chicas.
- `< 768px`: top bar + drawer existentes (Niños activo), grid 1 columna, perfil apilado; `≥ 768px`: sidebar 248px, layout del mockup.
- Id inexistente en `/kids/[id]` → 404 de Next.js, sin stack de error.

## Plan de implementación

1. **Navegación:** extender `NavItem` con `href` en `lib/feed-data.ts` y actualizar `components/shared/sidebar.tsx` (recibe `pathname` vía `usePathname`; activo si `pathname === href` o, para `/kids`, si `pathname.startsWith("/kids")`).
2. **Shared:** crear `components/shared/avatar.tsx`, `badge.tsx`, `page-header.tsx`, `section-divider.tsx`, `info-list.tsx` con tokens de color ya definidos en `@theme` (`globals.css` de SPEC 01).
3. **Datos:** `lib/kids-data.ts` con los 8 `Kid` + `LinkedParent`, helper `getKidById(id: number)`.
4. **Lista:** `components/kids/kid-card.tsx` + `components/kids/kid-list.tsx` ("use client": `useState` para el query, filtro por `name.toLowerCase().includes(query)`) y `app/kids/page.tsx` (Server) componiendo header, buscador y grid.
5. **Perfil:** `app/kids/[id]/page.tsx` (Server, `await params`, `getKidById`, `notFound()` si falta) componiendo "Volver a Niños", hero, banner alergias condicional, info-list y columna de padres.
6. **Verificación:** `npm run build`, `npx tsc --noEmit`, `npm run lint`; consultas Context7 para `dynamicRoutes`/`params` de Next.js 16.4.2 (`node_modules/next/dist/docs/`); comparación visual con Playwright en **1280px** y **375px** de `/kids`, `/kids/1`, drawer móvil, filtro con texto y filtro sin resultados, y 404 con id inexistente. Capturas en `.playwright-mcp/`.

## Criterios de aceptación

- [ ] `/kids` renderiza sin errores y `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan (rutas `/kids` y `/kids/[id]` en el output del build; 0 errores/warnings de consola).
- [ ] El sidebar marca "Niños" como activo en `/kids` y `/kids/1`, y "Feed" como activo en `/`; el drawer móvil refleja el mismo estado.
- [ ] `/kids` muestra el header GESTIÓN/Niños, botón "Agregar niño" (inerte), buscador y separador "SALA SOLES · 8 niños" idénticos al mockup.
- [ ] El grid muestra las 8 tarjetas con los datos exactos del mockup: avatar con letra + color, nombre, edad · padres vinculados, badge MANÍ en Mateo, LACTOSA en Tomás, VINCULAR en Valentina y chevron en el resto.
- [ ] Al tipear en el buscador la lista se filtra por nombre y el contador del separador se actualiza; con texto sin coincidencias aparece el estado vacío.
- [ ] Click en una tarjeta navega a `/kids/:id` con el id numérico del niño.
- [ ] `/kids/1` visualmente idéntico a `perfil-nino.dc.html`: link "Volver a Niños", hero 84px + Editar, banner de alergias, card de datos (12 mar 2022 / Soles / feb 2025), botón "Resumen del día" y card PADRES VINCULADOS (Lucía ACTIVA, Diego PENDIENTE, "Vincular otro padre").
- [ ] Cada uno de los 8 perfiles renderiza con sus datos mock; Valentina sin padres muestra la card solo con el link VINCULAR.
- [ ] `/kids/999` responde 404 vía `notFound()`.
- [ ] A 1280px las capturas de `/kids` y `/kids/1` coinciden con los mockups; a 375px el grid es de 1 columna, el perfil se apila y el drawer móvil funciona.
- [ ] Los links inertes (Agregar niño, Editar, Resumen del día, Vincular otro padre) no navegan fuera de la ruta actual.

## Decisiones tomadas y descartadas

- **Id numérico** (elegido por el usuario) vs slug descriptivo: URLs menos semánticas pero más simples y sin riesgo de colisión/normalización de nombres.
- **Buscador funcional client-side** vs inerte (usuario eligió funcional): `useState` + filtro local, sin necesidad de server round-trip.
- **Mock completo de los 8 niños** (usuario eligió): cualquier perfil `/kids/:id` tiene datos coherentes; solo el de Mateo es pixel-fiel al mockup.
- **Active por `usePathname()`** vs flag `active` hardcodeado en el mock: SPEC 01 dejó el flag fijo (`Feed: true`); con 2 rutas reales el flag se volvería mentira en `/kids`.
- **Componentes shared extraídos** (avatar, badge, page-header, section-divider, info-list) vs duplicar markup: los dos mockups repiten esos patrones; la SPEC 01 los anticipó en la estructura `shared/`.
- **Server Components por defecto**: solo `sidebar.tsx` y `kid-list.tsx` son `"use client"` (estado de drawer y filtro); el perfil es 100% server.
- **Estado vacío del filtro** ("Sin resultados"): el mockup no lo muestra, pero un filtro real necesita feedback; texto neutro siguiendo el estilo.
- **Página 404 global de Next** (`not-found`) en vez de una custom: fuera del alcance de esta spec.

## Riesgos

- **Next.js 16.4.2:** `params` de páginas dinámicas es una Promise (async); si se implementa a la vieja usanza tsc falla. Se valida con docs de `node_modules/next/dist/` + Context7 antes de codificar.
- La paridad "idéntica" depende de espaciados/radios precisos al convertir inline styles → Tailwind; se verifica por captura (como en SPEC 01).
- Colores de avatar repetidos entre tarjetas del mockup (sky/pink se repiten): se respeta la asignación del mockup 1:1 para la lista.
