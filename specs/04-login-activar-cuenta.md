# SPEC 04 — Login `/login` y activar cuenta `/activar-cuenta`

**Estado:** Aprobado
**Fecha:** 29 oct 2026
**Depende de:** SPEC 01

**Objetivo:** Implementar las pantallas de los mockups `references/pantallas/login.dc.html` (ruta `/login`) y `references/pantallas/activar-cuenta.dc.html` (ruta `/activar-cuenta`) como páginas fullscreen sin sidebar, visualmente idénticas y responsive a menos de 768px, sin el selector de rol Personal/Familia, conectando el flujo de navegación entre ambas y desde "Cerrar sesión".

## Alcance

**Incluye:**

- `/login` (split-screen, grid `1.05fr 1fr`, fondo `#FBF4EC`):
  - Panel de marca (columna izquierda): gradiente coral `155deg #F6A98E → #F2937A 45% → #EC7E62`, dos círculos decorativos (`rgba(255,255,255,.12)` 420px arriba-derecha y `.10` 300px abajo-izquierda), logo OpenDayCare (ícono sol en tile `rgba(255,255,255,.22)` rounded-14), titular Fredoka "El día de cada niño, compartido con su familia.", subtítulo "Publicá momentos, gestioná las salas y mantené a las familias cerca…" y footer "🌿 Guardería Sala Soles".
  - Panel de formulario (columna derecha, max-width 392px): título "Iniciar sesión" + subtítulo "Ingresá para ver el día de hoy.", labels eyebrow 12px uppercase (`EMAIL`), input email prellenado `caro@opendaycare.com`, label `CONTRASEÑA`, input password vacío con placeholder "••••••••", link "¿Olvidaste tu contraseña?" (inerte, `href="#"`), CTA gradiente "Iniciar sesión" → `/` y footer "¿Te invitó la guardería? **Activá tu cuenta**" → `/activar-cuenta`.
  - **Sin el bloque "INGRESO COMO" ni sus botones Personal/Familia** (decisión del usuario): el resto del diseño queda igual que el mockup.
  - Móvil (`< 768px`): el panel de marca se oculta y el formulario queda centrado; `≥ 768px`: idéntico al mockup.
- `/activar-cuenta` (card centrada, max-width 440px, pantalla fullscreen sin sidebar):
  - Logo 58px rounded-18 con gradiente y sombra coral, título "Bienvenida a OpenDayCare", subtítulo "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta."
  - Card de invitación: avatar "M" sky (`#A9D9E8/#1F7A93`) + "Te invitaron a seguir a" / "Mateo · Sala Soles".
  - Campos: `CÓDIGO DE INVITACIÓN` prellenado `7K4P9` (Fredoka, letter-spacing 3px), `EMAIL` prellenado `lucia.fernandez@gmail.com`, `CREAR CONTRASEÑA` prellenado con borde `#F2A78E`.
  - Checkbox de consentimiento (marcado): check verde `#5FB97E` sobre fondo `#FBF1D6`, texto "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app."
  - CTA gradiente "Activar mi cuenta" **inerte** (`href="#"`; en el mockup apunta a familia-feed, que no existe) y footer "¿Ya tenés cuenta? **Iniciar sesión**" → `/login`.
- Navegación existente conectada: el link "Cerrar sesión" de `components/shared/sidebar.tsx` (hoy `href="#"`) pasa a `/login`.
- Los inputs de ambas pantallas son nativos e inertes (visual + valores del mockup), sin estado React ni validación.

**No incluye (diferido a otras specs):**

- Selector de rol "INGRESO COMO" (Personal/Familia): excluido por decisión del usuario.
- Pantalla de familia (`familia-feed.dc.html`): por eso el CTA "Activar mi cuenta" queda inerte.
- "¿Olvidaste tu contraseña?" funcional (recuperación de contraseña): link inerte.
- Validación de formulario, estados de error, autenticación real o persistencia: las pantallas son visuales con datos mock.
- Protección de rutas / redirección automática si hay sesión.

## Estructura de archivos

```
app/
  login/
    page.tsx              → NUEVO: split-screen login (Server Component, sin estado)
  activar-cuenta/
    page.tsx              → NUEVO: card centrada de activación (Server Component, sin estado)
components/
  shared/
    sidebar.tsx           → MODIFICADO: href de Cerrar sesión "#" → "/login"
```

Ni `lib/` ni `globals.css` cambian: no hay datos nuevos y los colores exactos del mockup (`#FBF4EC`, `#F6A98E`, `#F2937A`, `#EC7E62`, `#EADFD0`, `#94887B`, `#3F362E`, `#C5503A`, `#A9D9E8`, `#1F7A93`, `#F2A78E`, `#FBF1D6`, `#5FB97E`, `#F4977E`, `#EE8164`) se usan como valores del mockup (el gradiente/sombra queda como clase arbitraria, excluida del cleanup de SPEC 03 por no tener equivalente canónico).

## Modelo de datos

Esta spec no introduce nuevas estructuras de datos ni modifica las existentes. No requiere mocks en `lib/`: ambos mockups son pantallas de texto e inputs estáticos (la card de invitación "Mateo · Sala Soles" es texto fijo, no requiere leer `kids-data.ts`). Reutiliza las fuentes (`Fredoka`/`Nunito` ya cargadas en `app/layout.tsx`) y los tokens de `app/globals.css` de SPEC 01.

## UX y estados

- Los únicos estados definidos son los del mockup: login con email prellenado (`caro@opendaycare.com`, el estado inicial del mockup con rol Personal) y contraseña vacía con placeholder; activación con los 3 campos prellenados y checkbox marcado.
- Links del login: "¿Olvidaste tu contraseña?" inerte; "Activá tu cuenta" ↗ `/activar-cuenta`; CTA ↗ `/`.
- Links de activación: footer ↗ `/login`; CTA inerte (permanece en `/activar-cuenta`).
- Ambas páginas son fullscreen: sin sidebar, sin drawer, sin header de app.
- Móvil: login oculta panel de marca (`hidden md:flex`) y centra el form con el padding del mockup; activar-cuenta ya es una card centrada que funciona igual a 375px.

## Plan de implementación

1. `app/login/page.tsx`: split-screen desktop con panel de marca y formulario completo (sin bloque de rol), links y CTA según alcance. Manual: `/login` se ve como el mockup, el CTA lleva a `/`.
2. Login responsive: ocultar panel de marca `< 768px` y centrar el formulario.
3. `app/activar-cuenta/page.tsx`: card centrada con los 3 campos prellenados, checkbox marcado, CTA inerte y footer → `/login`. Manual: `/activar-cuenta` se ve como el mockup.
4. `components/shared/sidebar.tsx`: cambiar el `href` de Cerrar sesión a `/login`. Manual: desde `/` el botón del usuario lleva a `/login` (desktop y drawer móvil).
5. Verificación de la spec (spec-verifier): `npm run build`, `npx tsc --noEmit`, `npm run lint`, consultas Context7 si algo de Next.js 16.4.2 lo requiere, y paridad visual con Playwright en 1280px y 375px contra los mockups (capturas en `.playwright-mcp/`).

## Criterios de aceptación

- [x] `/login` y `/activar-cuenta` renderizan sin errores y `npm run build` + `npx tsc --noEmit` + `npm run lint` pasan (rutas nuevas visibles en el output del build; 0 errores / 0 warnings de consola en ambas rutas).
  - Evidencia (verificador, 30 oct 2026): `npm run build` OK — output lista `○ /activar-cuenta` y `○ /login` entre las 16 rutas; `npx tsc --noEmit` sin output; `npm run lint` sin output. Consola Playwright en ambas rutas a 1280px y 375px: "Total messages: 3 (Errors: 0, Warnings: 0)" en cargas frescas repetidas; 1 aviso de hidratación intermitente (`caret-color:transparent` sobre inputs con `defaultValue`, clase conocida de causa externa — autofill/restauración del navegador, según la propia lista de causas de react.dev/next.js) no reproducible en ≥5 cargas frescas.
- [x] `/login` a 1280px es visualmente idéntico a `login.dc.html` **excepto por el bloque de rol**: gradiente y círculos del panel de marca, logo, titular, subtítulo, footer "🌿 Guardería Sala Soles", formulario (EMAIL prellenado `caro@opendaycare.com`, placeholder de contraseña "••••••••"), link "¿Olvidaste tu contraseña?", CTA gradiente y footer "¿Te invitó la guardería? Activá tu cuenta".
  - Evidencia: comparación por visión de `.playwright-mcp/04-login-1280.png` vs mockup servido por HTTP `.playwright-mcp/04-mockup-login-1280.png` — panel de marca (gradiente 155deg coral, círculos 420/300px, tile logo rounded-14, h1 42px, footer 🌿) y formulario (email prellenado, placeholder borrosa, link rojo, CTA gradiente, footer) idénticos; única diferencia la del bloque excluido por decisión del usuario.
- [x] En `/login` NO existe ninguna traza del selector "INGRESO COMO" ni de los botones Personal/Familia (ni en desktop ni en móvil).
  - Evidencia: HTML servido de `/login` (curl) sin "INGRESO COMO" ni "Personal"; a11y snapshot de `/login` a 1280px sin esos elementos; capturas desktop y móvil (`.playwright-mcp/04-login-1280.png`, `04-login-375.png`) sin el bloque.
- [x] El CTA "Iniciar sesión" navega a `/`; el link "Activá tu cuenta" navega a `/activar-cuenta`; "¿Olvidaste tu contraseña?" no navega fuera de `/login`.
  - Evidencia: clicks con Playwright — CTA → URL `http://localhost:3000/`; "Activá tu cuenta" → `http://localhost:3000/activar-cuenta`; "¿Olvidaste tu contraseña?" (`href="#"`) → URL permanece `/login#`.
- [x] `/activar-cuenta` a 1280px es visualmente idéntica a `activar-cuenta.dc.html`: logo 58px, título, subtítulo, card de invitación (avatar M sky + "Mateo · Sala Soles"), código `7K4P9` prellenado con letter-spacing, email `lucia.fernandez@gmail.com` prellenado, contraseña prellenada con borde `#F2A78E`, checkbox marcado (fondo `#FBF1D6`, check `#5FB97E`), CTA gradiente y footer "¿Ya tenés cuenta? Iniciar sesión".
  - Evidencia: comparación por visión de `.playwright-mcp/04-activar-1280.png` y `04-activar-1280-footer.png` (full page) vs `.playwright-mcp/04-mockup-activar-1280.png` — cada elemento del listado coincide 1:1; HTML servido contiene `7K4P9` y `lucia.fernandez@gmail.com`.
- [x] El CTA "Activar mi cuenta" no navega (la URL permanece `/activar-cuenta`); el footer "Iniciar sesión" navega a `/login`.
  - Evidencia: clicks con Playwright — CTA (`href="#"`) → URL `http://localhost:3000/activar-cuenta#`; footer → `http://localhost:3000/login`; a11y snapshot confirma `/url: "#"` para el CTA.
- [x] Ambas pantallas son fullscreen (sin sidebar 248px ni top bar móvil).
  - Evidencia: capturas `.playwright-mcp/04-login-1280.png`, `04-activar-1280.png`, `04-login-375.png`, `04-activar-375.png` — sin sidebar ni top bar en ninguna; las páginas no renderizan `<Sidebar/>` (código de `app/login/page.tsx` y `app/activar-cuenta/page.tsx`).
- [x] A 375px: `/login` oculta el panel de marca y muestra solo el formulario centrado, y `/activar-cuenta` mantiene la card centrada usable; a 1280px ambas coinciden con las capturas de los mockups.
  - Evidencia: capturas `.playwright-mcp/04-login-375.png` (solo formulario centrado, sin panel de marca) y `04-activar-375.png` (card centrada y legible con todos los campos + CTA + footer); paridad 1280px cubierta por los puntos anteriores.
- [x] El link "Cerrar sesión" del sidebar navega a `/login` en desktop y en el drawer móvil.
  - Evidencia: `components/shared/sidebar.tsx` L141 `href="/login"` (antes `href="#"`); clicks verificados con Playwright: desde `http://localhost:3000/` (a11y snapshot: "Cerrar sesión" con `/url: /login`) → URL `http://localhost:3000/login`; con drawer abierto a 375px (overlay visible), click en "Cerrar sesión" del drawer → URL `http://localhost:3000/login`.

## Decisiones tomadas y descartadas

- **Sin selector de rol** (decisión del usuario, bloque "INGRESO COMO" excluido) vs fidelidad 1:1 al mockup: los botones no aportan sin pantallas Personal/Familia diferenciadas; el resto del diseño queda igual.
- **CTA "Iniciar sesión" → `/`** vs inerte: el feed de personal ya existe; un login que no inicia sesión no completa su trabajo. La pantalla de familia no existe y no se finge su flujo.
- **CTA "Activar mi cuenta" inerte** vs → `/`: el mockup apunta a familia-feed (inexistente); llevarlo al feed de personal rompería la coherencia narrativa. Se difiere a la spec de familia-feed.
- **Inputs prellenados como el mockup** (usuario eligió) vs inputs vacíos con placeholders: paridad visual exacta, mismo criterio de SPEC 01/02 (mockup primero). El login email lleva `caro@opendaycare.com` porque es el estado inicial del mockup (rol Personal).
- **Pantallas estáticas sin estado React** vs formularios controlados con validación: son pantallas visuales de mockup; la auth real pertenece a otra spec. Server Components por defecto, `href` nativos en vez de navegación programática.
- **Conectar "Cerrar sesión" → `/login` ya** (usuario eligió) vs dejar `href="#"`: la pantalla existe desde esta spec; el placeholder se volvería mentira.
- **Mobile: ocultar panel de marca** (usuario eligió) vs apilar paneles: el brand panel es decorativo; ocultarlo conserva el formulario completo como el mockup a menor ancho.
- **Fullscreen sin sidebar/layout compartido**: los mockups lo muestran así; es la primera pantalla con layout propio que no envuelve el sidebar.

## Riesgos

- La paridad del gradiente/sombra coral depende de clases arbitrarias (`bg-[linear-gradient(…)]`, `shadow-[…]`) excluidas del cleanup de SPEC 03; cualquier limpieza futura de estilos podría afectarlas — quedan marcadas como intencionales en esta spec.
- El check del checkbox y el `letter-spacing` del código son detalles chicos fáciles de omitir; la verificación por captura los cubre (ítem de criterios dedicado a la card de invitación y al código).

## Qué **no** está en esta spec

- Selector de rol Personal/Familia (decisión explícita: fuera).
- Familia-feed y el flujo del CTA "Activar mi cuenta".
- Recuperación de contraseña funcional.
- Validación de formularios, errores de auth, sesión real o protecciones de rutas.

Cada uno de esos, si aterriza, va en su propia spec.

---

## Extensión post-implementación — Route groups `(app)`/`(auth)` (30 oct 2026)

Pedido explícito del usuario, fuera del alcance original de esta spec (registrado a modo de decisión). Refactor organizativo sin cambio de URLs ni de visual, verificado: `npm run build` ✓ (mismas 16 rutas), `npx next typegen` + `npx tsc --noEmit` ✓, `npm run lint` ✓, consola 0/0 en las 5 rutas y paridad visual por visión contra las capturas previas (`04-app-*.png` / `04-auth-*.png` vs `spec03-*` / `02-*` / `04-login-*` / `04-activar-*`, todas idénticas).

```
app/
  (app)/                  ← grupo del app de personal: layout con la shell flex + Sidebar 248px + main
    layout.tsx            → NUEVO (la shell antes repetida en las 3 páginas ahora vive acá)
    page.tsx              → movido desde app/page.tsx (misma URL /)
    kids/page.tsx         → movido desde app/kids/page.tsx (misma URL /kids)
    kids/[id]/page.tsx    → movido desde app/kids/[id]/page.tsx (misma URL /kids/:id)
  (auth)/                 ← grupo fullscreen sin sidebar
    layout.tsx            → NUEVO (bg #FBF4EC compartido de las pantallas de auth)
    login/page.tsx        → movido desde app/login/page.tsx (misma URL /login)
    activar-cuenta/page.tsx → movido desde app/activar-cuenta/page.tsx (misma URL /activar-cuenta)
```

- Las 3 páginas del grupo `(app)` quedan sin import de `Sidebar`; hay un único punto de la shell (`app/(app)/layout.tsx`).
- El `bg-[#FBF4EC]` de las pantallas de auth vive solo en `app/(auth)/layout.tsx`.
- Previo: `npx next typegen` necesario tras los movimientos (los tipos en `.next/types` cacheados referían las rutas viejas y hacía fallar `tsc`).
- Como existe un único root layout (`app/layout.tsx` con html/body/fuentes), los layouts de `(app)` y `(auth)` son layouts anidados: la navegación entre grupos (ej.: "Iniciar sesión" → `/`) sigue siendo client-side normal, sin reload completo (ese caso aplica solo a *múltiples* root layouts sin top-level según los docs de Next).
