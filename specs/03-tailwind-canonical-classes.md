# SPEC 03 — Clases canónicas de Tailwind (limpieza de estilos)

**Estado:** Implementado y verificado ✅ (checks con evidencia real — build/tsc/lint/Playwright), 29 oct 2026
**Fecha:** 29 oct 2026
**Depende de:** SPEC 01, SPEC 02

**Objetivo:** Eliminar los 13 warnings `tailwindcss(suggestCanonicalClasses)` de VS Code (`app/page.tsx` ×7, `components/shared/sidebar.tsx` ×6) y los mismos patrones en el resto del codebase, convirtiendo valores arbitrarios de espaciado/tamaño (`[Npx]`) a la escala de espaciado de Tailwind v4 (múltiplos de 4px, admiten decimales). **Cero cambio visual**: el CSS resultante es idéntico.

## Alcance

**Incluye:**

- Convertir todas las clases de espaciado/tamaño con valor arbitrario entre corchetes a su equivalente canónico: `p/px/py/pt/pb/pl/pr/m/mx/my/mt/mb/ml/mr/gap` (+ variantes `md:`), `h/w/min-w/max-w`. 48 conversiones en 10 archivos.

**No incluye (sin equivalente canónico, el linter no las marca):**

- `rounded-[12/14/16/18/20px]`, `border-[1.5px]`, `shadow-[…]`, `bg-[linear-gradient(…)]`, `bg-[#FBDAD6]`.
- Todo `text-[…px]` (tamaños tipográficos del mockup exactos).
- Refactor de lógica, tokens de `@theme` o estructuras.

## Mapeo de conversiones

| Archivo | Antes → Después |
|---|---|
| `app/page.tsx` | `max-w-[760px]`→`max-w-190` · `pt-[98px]`→`pt-24.5` · `md:pt-[34px]`→`md:pt-8.5` · `mt-[5px]`→`mt-1.25` · `px-[18px]`→`px-4.5` · `h-[38px] w-[38px]`→`h-9.5 w-9.5` |
| `components/shared/sidebar.tsx` | `h-[38px] w-[38px]`→`h-9.5 w-9.5` (×2) · `w-[248px]`→`w-62` · `w-[280px]`→`w-70` |
| `components/shared/avatar.tsx` | `h-[84px] w-[84px]`→`h-21 w-21` |
| `components/shared/badge.tsx` | `px-[9px]`→`px-2.25` · `py-[5px]`→`py-1.25` |
| `components/shared/info-list.tsx` | `px-[18px]`→`px-4.5` · `py-[15px]`→`py-3.75` |
| `components/shared/page-header.tsx` | `mb-[22px]`→`mb-5.5` |
| `components/home/post-card.tsx` | `px-[22px]`→`px-5.5` · `gap-[7px]`→`gap-1.75` (×3) · `gap-[18px]`→`gap-4.5` |
| `components/kids/kid-list.tsx` | `mb-[22px]`→`mb-5.5` · `gap-[11px]`→`gap-2.75` |
| `app/kids/page.tsx` | `max-w-[880px]`→`max-w-220` · `pt-[98px]`→`pt-24.5` · `md:pt-[34px]`→`md:pt-8.5` · `px-[18px]`→`px-4.5` · `py-[11px]`→`py-2.75` |
| `app/kids/[id]/page.tsx` | `gap-[7px]`→`gap-1.75` · `gap-[9px]`→`gap-2.25` · `gap-[18px]`→`gap-4.5` (×2) · `gap-[26px]`→`gap-6.5` · `mt-[3px]`→`mt-0.75` · `mb-[2px]`→`mb-0.5` · `py-[9px]`→`py-2.25` · `p-[13px]`→`p-3.25` · `px-[18px]`→`px-4.5` (×2) · `min-w-[300px]`→`min-w-75` · `w-[300px]`→`w-75` · `max-w-[820px]`→`max-w-205` · `pt-[98px]`→`pt-24.5` · `md:pt-[34px]`→`md:pt-8.5` |

Regla general: `N px → N/4` (ej. 18px→4.5, 38px→9.5, 248px→62, 760px→190). Tailwind v4 admite valores decimales dinámicos sobre `--spacing`.

## Plan de implementación

1. Aplicar el mapeo 1 a 1 con `edit` (contexto de línea completo para `gap-[18px]` y `w-[300px]`, que admiten varias ocurrencias o subcadenas).
2. Verificar con grep que no queda ningún patrón marcado por el linter (`(h|w|min-h|max-w|p…|m…|gap)-(px|rem)`).
3. `npm run build`, `npx tsc --noEmit`, `npm run lint`.
4. Paridad visual: capturas Playwright de `/` y `/kids/1` en 1280px y 375px comparadas contra las capturas previas de SPEC 01/02 (`.playwright-mcp/`).

## Criterios de aceptación

- [x] No queda ninguna clase espaciado/tamaño con valor arbitrario convertible en `app/**` y `components/**`; los 13 warnings originales y el resto desaparecen del panel Problems.
  Grep `(h|w|min-h|min-w|max-w|p|m|gap)-\[(\d+(\.\d+)?)(px|rem)\]` → 0 matches (48 conversiones aplicadas en 10 archivos: 13 originales + `h-[200px]` detectado en la pasada final; quedan intactas solo las excluidas por spec: `rounded-[…]`, `shadow-[…]`, `bg-[…]`, `border-[1.5px]`, `text-[…]`).
- [x] `npm run build`, `npx tsc --noEmit` y `npm run lint` pasan.
  `tsc --noEmit` exit 0, `next build` ✓ Compiled successfully en 7.7s (rutas `/`, `/kids`, `/kids/[id]`, `/_not-found` prerenderizadas), `eslint` exit 0.
- [x] La consola del navegador en `/` y `/kids/1` mantiene 0 errores / 0 warnings.
  Playwright `browser_console_messages`: "/" → Errors: 0, Warnings: 0; "/kids/1" → Errors: 0, Warnings: 0.
- [x] Paridad visual: capturas de `/` y `/kids/1` a 1280px y 375px idénticas a las previas (misma/sidebar 248px, max-width del feed, paddings y avatares sin corrimientos).
  `.playwright-mcp/spec03-home-1280.png`, `spec03-kid-1280.png`, `spec03-home-375.png`, `spec03-kid-375.png` vs mockups `references/pantallas/*.dc.html` y capturas previas de SPEC 01/02: sidebar 248px, feed max-width 760px, avatares 38px/84px, header de bienvenida, tarjetas, info-list y hero sin ningún corrimiento de espaciado.

## Decisiones tomadas

- **Todo el codebase** vs solo los 13 warnings visibles: el panel solo marca archivos abiertos; dejar el resto garantiza que los warnings no reaparezcan al abrirlos.
- **Conversión aritmética N/4** vs introducción de tokens CSS nuevos: la escala de Tailwind v4 ya resuelve decimales dinámicamente; cero riesgo de desvío.
- **Dejar `rounded-[…]`, `shadow-[…]`, `text-[…]` y colores arbitrarios intactos:** no tienen equivalente canónico y portan los valores exactos del mockup.

## Riesgos

- Bajos: el CSS generado es idéntico; cualquier desvío visual se detecta en la comparación de capturas y se revierte clase por clase.

---

## Extensión post-implementación — `rounded-2xl` / `rounded-lg` (31 oct 2026)

Signed off: el linter (`rounded-[16px] can be written as rounded-2xl` / `rounded-[8px] → rounded-lg`) ahora marca radios que en la pasada original se dejaron por "sin equivalente canónico". En Tailwind v4 esos valores SÍ existen sobre la escala de radios (`rounded-2xl` = 1rem = 16px, `rounded-lg` = 0.5rem = 8px a root 16px). Fix con cero cambio visual (5 conversiones en 3 archivos):

- `components/shared/info-list.tsx`: `rounded-[16px]` → `rounded-2xl` (card de datos).
- `app/(app)/kids/[id]/page.tsx`: `rounded-[16px]` → `rounded-2xl` (×2: banner de alergias + card de padres).
- `app/(auth)/activar-cuenta/page.tsx`: `rounded-[16px]` → `rounded-2xl` (card de invitación) · `rounded-[8px]` → `rounded-lg` (check del checkbox).

Verificación: grep `rounded-\[(8|16)px\]` → 0; `npx tsc --noEmit` + `npm run lint` + `npm run build` OK (16 rutas); radios computados por Playwright = 16px / 8px exactos y paridad visual de `/kids/1` y `/activar-cuenta` a 1280px sin corrimientos (`.playwright-mcp/fix-roundings-*.png`), consola 0/0. Quedan intactas las demás exclusiones (`rounded-[12/14/18/20/24px]` sin clase canónica, `shadow-[…]`, `bg-[…]`, `border-[1.5px]`, `text-[…]`).
