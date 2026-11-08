# SPEC 10 — Login real contra Supabase + protección de rutas + logout

> **Estado:** Implementado — Verificado ✅ por Verificador (spec-verifier), 8 nov 2026
> **Depende de:** SPEC 04 (pantallas `/login` y `/activar-cuenta` implementadas), SPEC 09 (tabla `users`, usuario seed `staff@opendaycare.test` en Supabase Auth)
> **Fecha:** 2026-11-08
> **Objetivo:** Conectar el formulario de `/login` con Supabase Auth (email + contraseña) vía Server Actions, proteger las rutas del app de personal (`/`, `/kids`, `/kids/:id`) redirigiendo a `/login` sin sesión, y conectar "Cerrar sesión" a un logout real.

## Por qué existe esta spec

SPEC 04 dejó las pantallas de auth visuales (inputs nativos, CTA `Link` a `/`), y SPEC 09 dejó un usuario staff real en Supabase Auth pero sin flujo de login en la app. El scaffold de `@supabase/ssr` ya existe (`utils/supabase/{server,client,proxy}.ts` + `proxy.ts` que en Next 16 reemplaza a `middleware.ts`) y refresca sesiones en cada request, pero hoy ninguna ruta está protegida: cualquiera puede ver el feed. Esta spec cierra el ciclo y sigue las guías actuales de Next.js 16 (docs locales `node_modules/next/dist/docs/`) y Supabase SSR (guía oficial + Context7, v0.12.7).

## Alcance

**Incluye:**

- **Login real** en `/login`: el formulario pasa de estático a Client Component con Server Action.
  - Server Action `signIn(state, formData)` en `actions/auth.ts`: valida campos mínimos (email con formato válido, contraseña no vacía — validación nativa, sin Zod), llama `supabase.auth.signInWithPassword()` con el client de servidor (`utils/supabase/server.ts` + `cookies()` de Next) y, al éxito, `redirect('/')`.
  - Credenciales inválidas: mensaje único genérico **"Email o contraseña incorrectos."** (sin revelar si el email existe), color `#C5503A` (paleta de SPEC 04).
  - Botón "Iniciar sesión" pasa de `<Link href="/">` a `<button type="submit">` del form, deshabilitado mientras pendiente, con las mismas clases visuales del mockup.
  - Email prellenado dinámico: en desarrollo (`process.env.NODE_ENV === 'development'`): `defaultValue="staff@opendaycare.test"` (el usuario seed real); en otros entornos: input vacío con placeholder de ejemplo `tu@ejemplo.com`. Contraseña siempre vacía con placeholder `••••••••`.
  - "¿Olvidaste tu contraseña?" sigue inerte (`href="#"`).
- **Protección de rutas con doble check** (patrón de la guía de Next: proxy optimista + check seguro junto a los datos):
  - Optimista, en `utils/supabase/proxy.ts`: después del `await supabase.auth.getClaims()` existente, si no hay claims y el path pertenece al app de personal (`/`, `/kids` y `/kids/:id`) → `NextResponse.redirect('/login')`; si hay claims y el path es `/login` → `NextResponse.redirect('/')`. Sin queries a la DB en el proxy.
  - Seguro, en `utils/supabase/dal.ts` (NUEVO): `getCurrentUser()`, funcionalidad cacheada con `cache()` de React, que llama `getClaims()` con el client de servidor y hace `redirect('/login')` si no hay sesión. `app/(app)/layout.tsx` lo consume (los docs advierten no confiar solo en el layout porque no re-renderiza en navegación client-side; el proxy cubre esos casos).
- **Logout real**: `signOut()` en `actions/auth.ts` con `supabase.auth.signOut()` (scope `default`, solo el dispositivo actual) + `redirect('/login')`. El "Cerrar sesión" de `components/shared/sidebar.tsx` (hoy `Link href="/login"`, cubre desktop y drawer móvil con el mismo componente) pasa a `<form action={signOut}>` con `<button>` de idéntica visual.

**No incluye (diferido a otras specs):**

- Policies de RLS de `public.users` (queda RLS on, deniega todo — decisión de SPEC 09).
- Autorización por rol (`staff`/`parent`/`admin`) ni rutas para familia: solo autenticación (¿hay sesión? sí/no). El rol vive hoy en `raw_user_meta_data` (editable por el usuario) y NO se usa para autorizar.
- Flujo de `/activar-cuenta` (invitaciones, signup desde la app): queda intocado.
- "¿Olvidaste tu contraseña?" funcional (recuperación por email): sigue inerte.
- Pantalla de familia (`familia-feed`).
- Registro de usuarios desde la UI.

## Modelo de datos

Esta spec no introduce nuevas estructuras de datos ni modifica las existentes. La sesión la gestiona Supabase Auth por cookies (`sb-<project-ref>-auth-token`, el patrón de `@supabase/ssr`): `signInWithPassword` escribe las cookies vía `setAll` del client de servidor, el proxy las refresca en cada request con `getClaims()`, y `signOut` las limpia. `public.users` no se consulta para autenticar.

## Estructura de archivos

```
actions/
  auth.ts                    → NUEVO: 'use server' — signIn(state, formData) y signOut()
utils/supabase/
  dal.ts                     → NUEVO: getCurrentUser() con cache() + redirect si no hay sesión
  proxy.ts                   → MODIFICADO: redirecciones por claims después de getClaims()
components/auth/
  login-form.tsx             → NUEVO: Client Component del formulario ('use client', useActionState)
components/shared/
  sidebar.tsx                → MODIFICADO: "Cerrar sesión" Link → form action signOut (misma visual)
app/(auth)/login/
  page.tsx                   → MODIFICADO: se queda con el panel de marca y delega el form en LoginForm
app/(app)/
  layout.tsx                 → MODIFICADO: consume getCurrentUser()
```

Ni `lib/`, ni `globals.css`, ni `next.config.ts` cambian. No hay dependencias nuevas (sin Zod). La visual de `/login` se mantiene idéntica al mockup (SPEC 04) salvo el estado de los campos indicado en alcance.

## UX y estados

- Login: estado inicial = siempre inputs (dev: email prefill del seed; resto: vacíos). Único estado de error: mensaje genérico bajo el campo de contraseña (encima del link "¿Olvidaste tu contraseña?"), sin desplazar el layout más de lo necesario.
- Pendiente: botón deshabilitado (sin spinner nuevo; el texto queda igual).
- Éxito: redirect a `/`; el feed carga con la sesión activa.
- Rutas protegidas sin sesión (carga directa o tras logout): redirect `/login` desde el proxy, sin render parcial del contenido.
- `/login` con sesión activa: redirect `/` (evita ver el login ya logueado).
- Logout en desktop y en drawer móvil: mismo botón, mismo comportamiento (URL termina en `/login`, sesión borrada).

## Plan de implementación

1. `actions/auth.ts`: `signIn` + `signOut` (con los destructores mínimos de estado para `useActionState`). Manual: `npx tsc --noEmit` pasa; las actions aún no están conectadas a la UI.
2. `utils/supabase/dal.ts` con `getCurrentUser()` y su consumo en `app/(app)/layout.tsx`. Manual: `npm run build` OK las 3 rutas de `(app)` siguen renderizando.
3. `utils/supabase/proxy.ts`: lógica de redirección con los claims. Manual con `npm run dev`: sin sesión, `/` y `/kids` redirigen a `/login`; el resto del app sigue funcionando.
4. `components/auth/login-form.tsx` (Client Component con `useActionState`) + `app/(auth)/login/page.tsx` que lo consume. Manual: login válido con `staff@opendaycare.test` entra a `/`; inválido muestra el mensaje genérico; visual de pantalla intacta (comparar contra las capturas de SPEC 04).
5. `components/shared/sidebar.tsx`: "Cerrar sesión" → form con `signOut`. Manual: logout desde desktop y drawer móvil → `/login`; refrescar `/` sigue mandando a `/login`.
6. Verificación de la spec (spec-verifier): `npm run build`, `npx tsc --noEmit`, `npm run lint`, consultas Context7/docs locales si algo de Next.js 16.4.2 o `@supabase/ssr` lo requiere, y flujos E2E con Playwright con el usuario seed (capturas en `.playwright-mcp/`): login válido / inválido / sin sesión a `/`, `/kids` y `/kids/:id` / con sesión a `/login` / logout desktop y móvil / recarga post-logout, siempre a 1280px y 375px con consola sin errores.

Cada paso queda en un estado compilable y funcional; el commit se hace después de cada paso verificado.

## Criterios de aceptación

- [x] `npm run build`, `npx tsc --noEmit` y `npm run lint` pasan sin errores.
  - ✅ Verificado (8 nov 2026): `npm run build` exit 0 (16/16 páginas; `ƒ /`, `ƒ /kids`, `ƒ /kids/[id]` dinámicas, `○ /login` estático, Proxy listado), `npx tsc --noEmit` sin output, `npm run lint` sin output (0 errores / 0 warnings).
- [x] Con credenciales válidas (`staff@opendaycare.test` / `DayCare2026!`), el CTA inicia sesión y redirige a `/` con la UI del app visible (sidebar con el usuario, feed cargado).
  - ✅ Verificado (8 nov 2026): Playwright — submit → URL `http://localhost:3000/`; sidebar "Caro Giménez · Maestra · Soles" + feed completo; captura `.playwright-mcp/10-feed-loggedin-1280.png`; consola 0/0.
- [x] Con credenciales inválidas (contraseña incorrecta o email inexistente), la URL permanece en `/login` y aparece exactamente el mensaje "Email o contraseña incorrectos." en `#C5503A`, sin revelar cuál dato falló.
  - ✅ Verificado (8 nov 2026): ambos casos (`WrongPass123!` y `desconocido@opendaycare.test`) → `location.pathname === '/login'`, `p[role=alert]` texto exacto y `color: rgb(197, 80, 58)` (= `#C5503A`).
- [x] Sin sesión, cargar `/`, `/kids` o `/kids/:id` directamente redirige a `/login` (por proxy) y ninguna porción del contenido del app aparece en el HTML.
  - ✅ Verificado (8 nov 2026): curl sin cookies — 3 GET → `307 Location: /login`; HTML final de `/login` sin nav ni "Nueva publicación" ni "Cerrar sesión" (los únicos hits de "Feed" son `<title>`/`<meta description>` del root layout, branding global por diseño).
- [x] Con sesión activa, cargar `/login` redirige a `/`.
  - ✅ Verificado (8 nov 2026): Playwright con sesión de página → `browser_navigate('/login')` termina en `Page URL: http://localhost:3000/`.
- [x] El click en "Cerrar sesión" del sidebar (desktop a 1280px y drawer móvil a 375px) borra la sesión, redirige a `/login`, y una recarga posterior de `/` vuelve a redirigir a `/login`.
  - ✅ Verificado (8 nov 2026): 1280px — click → `/login`; re-navegar `/` → `/login`. 375px — drawer "Abrir menú" → "Cerrar sesión" → `/login`; re-navegar `/` → `/login`.
- [x] En desarrollo el input EMAIL de `/login` viene prellenado con `staff@opendaycare.test`; la contraseña está siempre vacía con placeholder "••••••••".
  - ✅ Verificado (8 nov 2026): a11y snapshot muestra `textbox "tu@ejemplo.com": staff@opendaycare.test` y `textbox "••••••••"` vacío; el HTML servido contiene `staff@opendaycare.test` y ya no contiene `caro@opendaycare.com` (prefill condicionado a `NODE_ENV === 'development'` en `app/(auth)/login/page.tsx`).
- [x] `/login` sigue visualmente par con el mockup de SPEC 04 a 1280px y 375px (panel de marca, gradientes, CTA gradiente, footers — comparación por captura contra `.playwright-mcp/04-login-*.png`).
  - ✅ Verificado (8 nov 2026): `.playwright-mcp/10-login-1280.png` vs mockup servido `.playwright-mcp/10-mockup-login-1280.png` (http://localhost:4173/login.dc.html) — brand panel (gradiente 155deg, círculos, tile logo, h1 Fredoka, footer 🌿) y form panel idénticos; únicas diferencias las de alcance: sin bloque "INGRESO COMO" (decisión SPEC 04) y email `staff@opendaycare.test` (esta spec). `.playwright-mcp/10-login-375.png` vs `04-login-375.png`: solo el formulario centrado con los mismos estilos.
- [x] 0 errores / 0 warnings de consola en `/login`, `/` y `/kids` en ambos viewports, en las cargas verificadas.
  - ✅ Verificado (8 nov 2026): consola Playwright — `/login` 1280 = "Total messages: 5 (Errors: 0, Warnings: 0)", `/` 1280, `/kids` 1280, `/kids` 375 y `/` 375 = 0/0; único ruido VERBOSE de autocomplete del DOM (nivel verbose, sugerencia de Chromium autofill, no cuenta como error/warning).
- [x] La sesión se refresca transparentemente: navegando por `/` y `/kids` tras >1 hora simulada de expiración no cierra la sesión (el proxy renueva las cookies).
  - ✅ Verificado (8 nov 2026): tampering de la cookie `sb-…-auth-token` con `expires_at = now − 7200s` → navegación a `/kids` y `/` mantiene la sesión (sidebar con usuario, consola 0/0) y la cookie pasa de `expirada: true` a `expirada: false` (el proxy refrescó el token — JWT ES256 con keys asimétricas del proyecto — y escribió la cookie renovada).

## Decisiones

- **Sí:** `supabase.auth.getClaims()` en vez de `getSession()` para cualquier decisión de sesión en servidor (proxy + DAL). La guía de Supabase SSR marca a `getSession()` como no confiable en servidor (lee la cookie sin revalidar); `getClaims()` verifica la firma del JWT en cada llamada.
- **Sí:** doble check de protección (proxy optimista con cookies + DAL segura junto a los datos). Los docs de Next 16 advierten: el layout no se re-ejecuta en navegaciones client-side y un matcher del proxy puede dejar sin cobertura Server Functions; la guía de autenticación recomienda centralizar el check en la DAL y llamarlo cerca de los datos.
- **No:** consultar `public.users` para autenticar. El login es contra `auth.users`; RLS de `users` sigue sin policies (SPEC 09) y no toca abrirla en esta spec.
- **No:** usar el `role` de `raw_user_meta_data` para autorizar. Es un claim editable por el usuario (regla de seguridad de Supabase); la autorización por rol va en su propia spec (con `app_metadata`/policies).
- **Sí:** logout con scope `default` (solo el dispositivo actual) vs `global` (revocaría todas las sesiones): es el comportamiento estándar del "Cerrar sesión" para una app de guardería; cerrar sesión en la compu no desloguea el teléfono. La spec lo documenta como decisión, no como default accidental.
- **No:** Zod para la validación. El form solo necesita email con formato y contraseña no vacía; `type="email"` + checks mínimos en la action cubren eso sin dependencia nueva.
- **Sí:** mensaje de error genérico único. Supabase distingue "invalid credentials" de "email not confirmed"; mezclar errores específicos filtra qué emails existen.
- **Sí:** email prellenado en desarrollo con `staff@opendaycare.test` (el único usuario que puede iniciar sesión realmente, SPEC 09) y vacío con placeholder en otros entornos: el mail del mockup (`caro@opendaycare.com`) no existe en Auth y haría fallar el login en dev.
- **Sí:** CTA "Iniciar sesión" deja de ser `<Link>` y pasa a submit del form: debía existir un real login, y un Link a `/` con sesión falsa es mentira que ya no hace falta sostener.
- **Sí:** Server Actions (patrón recomendado por la guía de Supabase para App Router: las cookies se pueden escribir ahí, y el.Server Action corre solo en servidor) vs `signInWithPassword` desde el browser client: el server-side evita exponer el manejo de sesión al browser y permite redirigir sin cliente intermedio.
- **No:** tocar `/activar-cuenta` ni sus datos mock: el flujo de invitaciones es otra spec.
- **No:** crear el archivo `middleware.ts`: en Next 16 la convención vigente es `proxy.ts` (ya presente, con comentario del proyecto) y `middleware` está deprecado.

## Riesgos

| Riesgo                                                                                                                                                                                                            | Mitigación                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El password hash del seed de SPEC 09 se insertó con `crypt(..., gen_salt('bf'))` vía SQL admin: si no es 100% equivalente a lo que Supabase Auth espera para validar, el login fallará con credenciales correctas | Verificar primero con el usuario seed en paso 4; si falla la auth, registrar el error y decidir con el usuario (recrear el usuario vía dashboard/`auth.admin`, no hackear la verificación) |
| `cacheComponents` está activo: leer cookies en el layout de `(app)` hace dinámicas sus páginas                                                                                                                    | Aceptado: son rutas por usuario; el feed hoy ya es dinámico en la práctica (props de sesión, etc.), y los datos mock de `lib/` no cambian                                                  |
| El proxy redirige también en requests internas (RSC/prefetch) si el matcher lo incluye                                                                                                                            | Mantener el matcher existente sin tocar; las redirecciones del proxy son idempotentes (un redirect a `/login` con sesión ausente es inofensivo en prefetch)                                |
| El prefill dev via `NODE_ENV` podría llegar a un build de producción con `NODE_ENV=development` por error                                                                                                         | Condición única (`process.env.NODE_ENV === 'development'`) y verificada en los criterios de aceptación; documentado en la spec                                                             |

## Qué **no** está en esta spec

- Policies de RLS para `public.users`.
- Autorización por rol y pantallas por rol (staff vs familia).
- Flujo de activación de cuenta / invitaciones / signup.
- Recuperación de contraseña funcional.
- Registro de usuarios desde la UI.
- Pantalla de familia `familia-feed`.

Cada uno de esos, si aterriza, va en su propia spec.
