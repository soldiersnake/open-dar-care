# SPEC 15 — Vincular padre real: invitación por email (Resend) + activación de cuenta con código

> **Estado:** Implementado — Verificado ✅ por Verificador (spec-verifier), 17 nov 2026 (re-verificación post-upgrade Next 16.4.6; verificación completa original 16 nov 2026)
> **Depende de:** SPEC 04 (pantallas `/login` y `/activar-cuenta`), SPEC 06 (modal "Vincular padre" client-side), SPEC 09 (tabla `users` + trigger `on_auth_user_created`), SPEC 10 (login real + protección de rutas), SPEC 12/13 (lista y perfil de `/kids` conectados a la DB), SPEC 14 (entorno dual `dev:mock` / real)
> **Fecha:** 2026-11-16
> **Objetivo:** Convertir la vinculación de un padre en un flujo real de punta a punta: el staff envía la invitación desde el modal de SPEC 06 (código persistido en la DB + correo enviado con Resend) y el padre se registra en `/activar-cuenta` validando el código, creando su cuenta con rol `parent` y el vínculo `parent_children` con el niño.

## Por qué existe esta spec

SPEC 06 dejó el modal "Vincular padre" funcionando solo en memoria (código visual, fila PENDIENTE client-side, sin email ni persistencia) y SPEC 04 dejó `/activar-cuenta` estática con datos de mockup. El schema de referencia (`07-DB-Schema` §5/§6) ya diseñó `parent_children` e `invitations` con sus enums, y SPEC 09 dejó el trigger `handle_new_user()` listo para crear perfiles desde el signup. Esta spec cierra el ciclo completo: DB → envío → registro.

## Alcance

**Incluye:**

- **Migraciones DB** (patrón SPEC 09, numeración a confirmar contra `list_migrations`):
  - Migración de enums: `relationship_type` (`father`/`mother`/`guardian`) e `invitation_status` (`pending`/`accepted`/`expired`/`cancelled`), con `COMMENT ON TYPE` en español.
  - Migración de tablas: `invitations` (§6 del schema) y `parent_children` (§5 del schema), ambas con RLS habilitado y **sin policies** (patrón del proyecto: el server accede con el admin client, SPEC 12), comentarios `COMMENT ON TABLE/COLUMN` en español e índices sobre `child_id`.
- **Envío de email con Resend:**
  - Dependencia npm `resend` en `package.json`.
  - Variables de entorno: `RESEND_API_KEY` (clave real, el usuario la completa) y `CONTACT_FROM_EMAIL=contacto@marianomaciasgandulfo.com` (dominio ya verificado en resend.com, decisión del usuario). `.env.local` (no commiteado) lleva la clave real; `.env.example` se documenta con el placeholder `re_xxxxxxxx` + `CONTACT_FROM_EMAIL` para ir documentando (pedido explícito del usuario).
  - `lib/email.ts` (NUEVO): client de Resend + `sendInvitationEmail({ to, fullName, childName, code, activationUrl })` con plantilla HTML de **branding ligero** (CSS inline, Resend no soporta `<style>` en algunos clientes): fondo `#FBF4EC`, saludo "Hola {nombre}", texto "Te invitaron a seguir el día de {childName}. Creá tu contraseña para activar tu cuenta.", código de 5 caracteres en grande, texto "Vence en 7 días" y botón gradiente coral (`#F4977E → #EE8164`) **"Activar mi cuenta"** que lleva a `/activar-cuenta?code={code}&email={email}`. Fuente del sistema (sans-serif); sin logo complejo.
  - La URL absoluta de activación se arma desde `headers()` (host de la request) — sin variable de entorno nueva.
- **Server Action `createInvitation`** (`actions/invitations.ts` NUEVO, `'use server'`):
  - Valida con el admin client: el niño existe; el email NO tiene invitación `accepted` para ese niño (⟺ ya vinculado: los vínculos solo nacen de una invitación aceptada) → mensaje inline **"Este email ya está vinculado a {nombre del niño}."** y no se crea nada.
  - Si existe invitación `pending` NO expirada para el mismo email+niño → la marca `cancelled` y crea una nueva (reinvitar regenera: nuevo código + 7 días frescos; decisión del usuario).
  - Un email con vínculos a OTROS niños se permite: un padre puede vincularse a N niños (decisión del usuario); cada niño tiene su propia invitación con su propio código.
  - Inserta la fila en `invitations` con `code` (ver unicidad abajo), `expires_at = now() + 7 días`, `invited_by` = usuario staff de la sesión (SPEC 10), `relationship` mapeado del chip.
  - Envía el email con Resend. Si el envío falla (clave ausente/inválida, red): la invitación queda `pending` en la DB y el modal muestra mensaje inline "No se pudo enviar el correo. Reintentá." — reinvitar cancela la previa y regenera.
  - Código: el client genera los 5 caracteres al abrir el modal con el helper de SPEC 06 (`INVITATION_CODE_ALPHABET` sin O/I/L/0/1) y lo manda en el form; el server lo normaliza a mayúsculas y verifica unicidad (`code` UNIQUE): ante colisión regenera server-side y devuelve el código final (casi imposible: espacio de 31^5). El código mostrado en la caja amarilla es el código enviado.
- **Modal real (dual-mode, patrón SPEC 14):**
  - Modo real: "Enviar invitación" llama a la Server Action (`useTransition`); en éxito cierra el modal, muestra el toast de éxito y la lista del perfil se actualiza con `router.refresh()` (la fila PENDIENTE ya viene de la DB, no se antepone client-side). En error (email vinculado, fallo de email) el modal NO se cierra y muestra el mensaje inline del server.
  - Modo `dev:mock` (`mockMode`): comportamiento actual de SPEC 06/14 intacto (código client, fila antepuesta en memoria, sin POST ni email).
- **Bloque "PADRES VINCULADOS" real** (`app/(app)/kids/[id]/page.tsx`):
  - En modo real la página arma las filas desde la DB: filas **ACTIVA** desde `parent_children` (nombre desde `public.users`, email vía `auth.admin.getUserById(parent_id)` con el admin client, parentesco traducido `father→Papá`/`mother→Mamá`/`guardian→Tutor/a`) y filas **PENDIENTE** desde `invitations` con `status='pending'` y `expires_at > now()` (nombre/email/parentesco de la propia invitación). Avatar con inicial + color alternado como el mock.
  - En `dev:mock` sigue leyendo `kid.parents` del mock (SPEC 13/14).
- **Activación real** (`actions/activation.ts` NUEVO + `components/auth/activation-form.tsx` NUEVO):
  - `/activar-cuenta` deja de ser estática: Client Component con `useActionState` y Server Action `activateAccount`.
  - Prefill desde query params: `?code=…&email=…` prellena CÓDIGO DE INVITACIÓN y EMAIL (coincide con el mockup, que los muestra prellenados); CREAR CONTRASEÑA siempre vacía. Sin query params: placeholders vacíos.
  - Normalización: código a mayúsculas, email a minúsculas.
  - Validaciones inline (mismo tratamiento de color `#C5503A` de SPEC 05/06): código inexistente → "Código de invitación inválido."; código con `expires_at` vencido → "La invitación expiró. Pedile a la guardería una nueva."; email distinto al de la invitación → "El email no coincide con la invitación."; contraseña < 6 caracteres → "La contraseña debe tener al menos 6 caracteres."; checkbox sin marcar → "Debés autorizar para continuar." Con errores no se crea nada.
  - Checkbox de consentimiento: obligatorio marcarlo, **no se persiste** (decisión del usuario: no hay columna en `users`).
  - Flujo A (email nuevo): `supabase.auth.signUp({ email, password, options.data: { daycare_id, role: 'parent', full_name } })` — el trigger de SPEC 09 crea el perfil (`status='active'`); `daycare_id` se deriva de la invitación (child → room → `rooms.daycare_id`); inserta `parent_children` (parent_id, child_id, relationship); marca la invitación `accepted` con `accepted_at = now()`. Como la confirmación de email de Supabase estará desactivada (decisión del usuario), `signUp` devuelve sesión: se hace `signOut()` inmediato para que el proxy de SPEC 10 no redirija `/login → /`, y luego `redirect('/login?activada=1')`.
  - Flujo B (email ya registrado en Auth — padre con un 2º niño): no hay segunda cuenta ni segundo password; la posesión del código válido acredita el email → inserta `parent_children`, marca la invitación `accepted` y `redirect('/login?activada=1')` con mensaje "Ya tenías cuenta: iniciá sesión para ver a tu familia." (decisión del usuario: un padre puede tener N niños).
  - `/login?activada=1` muestra un mensaje de éxito inline sobre el formulario ("Tu cuenta quedó lista. Iniciá sesión con tu email y contraseña."); sin el param, `/login` igual que SPEC 10.
  - Precondición manual (usuario): desactivar "Confirm email" en Supabase Dashboard → Authentication. Documentada en el plan; el criterio de aceptación la verifica por comportamiento (login inmediato post-activación).

**No incluye (diferido a otras specs):**

- El feed de familia (`familia-feed`) y qué ve el padre tras iniciar sesión: solo redirige a `/login` (decisión del usuario).
- Policies de RLS para `invitations`/`parent_children`/`users` (quedan RLS on, deniegan todo; acceso por admin client, patrón SPEC 12).
- UI para cancelar o eliminar invitaciones/vínculos, ni edición de padres.
- Cron/job que marque `expired` (la expiración se valida al usar el código; decisión del usuario).
- Rate limiting o captcha en la activación.
- Botón "reenviar email" específico (reinvitar desde el modal ya regenera).
- Guard por rol: el padre entra a `/` (feed de staff) si inicia sesión — la autorización por rol es otra spec (SPEC 10 lo documentó).
- Modificar `references/pantallas/`.

## Modelo de datos

Migración de enums (NUEVO, versión `0006` a confirmar contra el historial):

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
```

Migración de tablas (NUEVO, versión siguiente):

```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id),
  invited_by uuid not null references public.users (id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;
```

Más: índices `invitations(child_id)` y `parent_children(child_id)`; `COMMENT ON` en español. `invitations` no lleva `updated_at` (igual que el doc de referencia §6).

Mapa chip ↔ enum (en `lib/kids-data.ts` junto a los helpers de SPEC 06):

```ts
const RELATIONSHIP_BY_CHIP = {
  Mamá: "mother",
  Papá: "father",
  "Tutor/a": "guardian",
} as const;
```

El código se genera con los helpers existentes de SPEC 06 (`INVITATION_CODE_ALPHABET`, longitud 5). Sin estructuras nuevas en client: `LinkedParent`/`LinkedParentDraft` no cambian; las filas reales del perfil adoptan el mismo shape (nombre, `{relation} · {email}`, badge).

## UX y estados

- Modal (real): abrir genera código nuevo (SPEC 06); enviar válido → toast de éxito + fila PENDIENTE nueva en el perfil vía `router.refresh()`; enviar con email ya vinculado o fallo de email → mensaje inline y modal abierto; cerrar por X/overlay/Esc no crea nada.
- Perfil (real): filas ACTIVA (vínculos) y PENDIENTE (invitaciones vigentes) mezcladas en orden por `created_at` descendente (el mock muestra ambos badges, mismo formato); en dev:mock todo igual que SPEC 14.
- Email: HTML de una card centrada con el código en grande y el botón que abre `/activar-cuenta` prellenada.
- `/activar-cuenta`: 4 estados — vacía (placeholders), prellenada desde el email, con errores inline, y éxito (redirect a `/login?activada=1`).
- `/login?activada=1`: banner de éxito sobre el form; `/login` limpio sin cambios.

## Plan de implementación

1. **Precondiciones:** vía Supabase MCP confirmar la próxima versión de migración libre (tras `0005`) y que no existen los enums ni las tablas; el usuario desactiva "Confirm email" en Supabase Dashboard → Authentication (paso manual documentado).
2. Migración de enums + aplicar vía MCP. Verificación: `pg_enum` muestra los 2 enums con sus valores.
3. Migración de tablas + aplicar. Verificación: `information_schema`/`pg_constraint` confirman columnas, FKs, UNIQUE de `code` y de `(parent_id, child_id)`, RLS on y `pg_policies` count = 0 en ambas.
4. Dependencia y env: `npm i resend`; `.env.local` con `RESEND_API_KEY` (el usuario la completa) y `CONTACT_FROM_EMAIL=contacto@marianomaciasgandulfo.com`; `.env.example` con las 2 variables documentadas (`re_xxxxxxxx` como placeholder de la clave). `lib/email.ts` con la plantilla HTML. Manual: `npx tsc --noEmit` OK; un envío de prueba manual llega a la bandeja.
5. `actions/invitations.ts`: `createInvitation` con todas las validaciones, cancel-and-recreate, insert y envío. Manual con MCP: enviar desde una llamada de prueba crea la fila (código, expires_at +7d, pending); email ya aceptado → error; reinvitación → previa cancelled.
6. Modal + tarjeta dual-mode: submit real vía action, estados de error inline, `router.refresh()` del perfil; `page.tsx` real arma las filas desde DB (ACTIVA + PENDIENTE). Manual: flujo completo desde el modal con un email real, la fila aparece tras refresh; consola 0/0.
7. `actions/activation.ts` + `components/auth/activation-form.tsx` + prefill por searchParams + banner de éxito en `/login?activada=1`. Manual E2E con dos emails: (a) email nuevo → activa, crea cuenta+perfil+vínculo+accepted, login con la contraseña funciona; (b) email con cuenta previa (2º niño) → crea solo el vínculo, sin segunda cuenta.
8. Regresión `dev:mock`: modal client-side intacto, perfiles mock intactos.
9. Verificación de la spec (spec-verifier): `npm run build`, `npx tsc --noEmit`, `npm run lint`, Context7/docs locales para Next 16.4.2 y `@supabase/ssr` si algo lo requiere, E2E Playwright a 1280px y 375px con consola 0/0 y capturas en `.playwright-mcp/`, y checks de DB vía MCP (filas, estados, vínculos).

Tras cada paso el proyecto queda compilable y funcional; el commit se hace después de cada paso verificado (por el usuario).

## Criterios de aceptación

- [x] `npm run build`, `npx tsc --noEmit` y `npm run lint` pasan sin errores.
  - ✅ Verificado (16 nov 2026): build exit 0 (`✓ Compiled successfully`, rutas `ƒ /`, `ƒ /kids`, `/kids/[id]` ◐, `◐ /activar-cuenta`, `◐ /login`), `npx tsc --noEmit` exit 0, `npm run lint` exit 0 — dos pasadas (inicio y cierre, esta última tras reverter la instrumentación temporal).
  - ✅ Re-verificado (17 nov 2026, tras el commit `7852b57` que incluyó el upgrade de seguridad Next 16.4.2 → 16.4.6): build exit 0 en 16.4.6 (mismas rutas/clasificación, y el advisory de seguridad ya NO interrumpe el build), `npx tsc --noEmit` sin output, `npm run lint` sin output. Smoke post-upgrade: perfil real de Uma con filas ACTIVA (`Lucía Spec15` + `Mariano` con emails de Auth), modal real genera código (`SW3EA`), `/activar-cuenta?code=XA2WC&email=padre@correo.com` prellena ambos campos con contraseña vacía y checkbox de consentimiento, consola 0 errores/0 warnings (4 mensajes). Servidor dev usado: puerto 3000, detenido al finalizar (quedó libre).
- [x] En el remoto existen los enums `relationship_type` (father/mother/guardian) e `invitation_status` (pending/accepted/expired/cancelled), las tablas `invitations` y `parent_children` con las columnas/UNIQUE del modelo de datos, RLS habilitado y `pg_policies` count = 0 en ambas; las versiones aparecen en `list_migrations`.
  - ✅ Verificado (16 nov 2026): `list_migrations` muestra `20261116152220 0010_create_invitation_enums` y `20261116152514 0011_create_invitations_parent_children`; `pg_enum` → `relationship_type = father,mother,guardian` e `invitation_status = pending,accepted,expired,cancelled`; `information_schema.columns` lista las 11 columnas de `invitations` y las 5 de `parent_children` con tipos/nullability/defaults exactos; `pg_constraint` confirma UNIQUE (code), UNIQUE (parent_id, child_id) y las FKs; `pg_class.relrowsecurity = true` y `pg_policies` count = 0 en ambas; índices `invitations_child_id_idx` y `parent_children_child_id_idx` presentes (más `invitations_email_idx` y `parent_children_parent_id_idx`).
- [x] `.env.example` documenta `RESEND_API_KEY=re_xxxxxxxx` (placeholder, sin clave real commiteada) y `CONTACT_FROM_EMAIL=contacto@marianomaciasgandulfo.com`; la clave real vive solo en `.env.local` (no commiteado).
  - ✅ Verificado (16 nov 2026): `.env.example` líneas 5–6 con el placeholder `re_xxxxxxxx` y el remitente; `git check-ignore .env.local` lo ignora y `git status` no lo lista; los nombres de variables en `.env.local` son solo `RESEND_API_KEY`/`CONTACT_FROM_EMAIL` (valores nunca impresos).
- [x] Con el modal real, un envío válido crea exactamente 1 fila `pending` en `invitations` (código de 5 chars del alfabeto, `expires_at = created_at + 7 días`, `invited_by` = staff de la sesión, relationship mapeado) y llega un correo desde `contacto@marianomaciasgandulfo.com` con el MISMO código mostrado en el modal y el botón hacia `/activar-cuenta?code=…&email=…`.
  - ✅ Verificado (16 nov 2026): modal mostró código `G3U7A` (`.playwright-mcp/spec15-modal-codigo-G3U7A.png`); MCP `execute_sql`: 1 fila `pending` con code `G3U7A`, `created_at 21:17:29.67` / `expires_at 21:17:30.63` (+7 días), `invited_by = ceb06f24…` (Ana Martínez, staff de la sesión, join con auth.users), `relationship='father'` (chip Papá); el log del server capturó el id de Resend `01a1e638-…` (envío real) y el HTML exacto enviado (captura del envío `YX6QW`, misma plantilla, en `.playwright-mcp/spec15-email-html-YX6QW.txt`): saludo "Hola Lucía Spec15", código en grande, "Vence en 7 días", botón `Activar mi cuenta` con `href="…/activar-cuenta?code=YX6QW&amp;email=mariano.maciasgandulfo%2Bspec15a%40gmail.com"`, fondo `#FBF4EC` y gradiente `#F4977E → #EE8164` (CSS inline). Nota: la API key de Resend del proyecto es send-only (401 al leer el email por API), por lo que el HTML se verificó con instrumentación temporal de log (removida al final).
- [x] Enviar un email con invitación `accepted` para ese niño muestra "Este email ya está vinculado a {niño}", no crea fila y no envía correo.
  - ✅ Verificado (16 nov 2026): modal con `Mariano.MaciasGandulfo@Gmail.com` (mayúsculas) sobre Uma → alerta inline "Este email ya está vinculado a Uma Macias." (`.playwright-mcp/spec15-error-email-vinculado.png`), count(invitations) se mantuvo en 3 y los ids de Resend en 2 (0 emails nuevos).
- [x] Reinvitar un email con invitación `pending` vigente para el mismo niño deja la previa `cancelled` y crea 1 nueva con código y `expires_at` nuevos.
  - ✅ Verificado (16 nov 2026): reinvitación de `+spec15a` sobre Uma → DB: `G3U7A` pasa a `cancelled` y aparece `YX6QW` `pending` con `created_at 21:19:23` / `expires_at 21:19:24` (+7d); el modal mostró el código nuevo `YX6QW`.
- [x] Un email ya vinculado a otro niño se puede invitar para un 2º niño: existen 2 invitations del mismo email con distinto `child_id`.
  - ✅ Verificado (16 nov 2026): `+spec15a` (accepted para Uma `d67261b7…`) invitada para Angela Testing `667bae0f…` → envío exitoso, fila `NYTMU` `pending` con `child_id` distinto (`.playwright-mcp/spec15-angela-pendiente-2do-nino.png`); quedan 2 invitations del mismo email con distinto `child_id` (ambas `accepted` tras el flujo B).
- [x] Si Resend no puede enviar (sin `RESEND_API_KEY`), el modal muestra el mensaje inline de reintento y la invitación queda `pending` en la DB.
  - ✅ Verificado (16 nov 2026): con la key neutralizada temporalmente en `.env.local` y `.env` (respaldadas y restauradas al final), el modal muestra "No se pudo enviar el correo. Reintentá." y queda abierto (`.playwright-mcp/spec15-error-sin-resend-key.png`); DB: `EYVJF` `cancelled` (reinvita) y `U5SXE` `pending`; log del server: `invitation email failed: Faltan RESEND_API_KEY o CONTACT_FROM_EMAIL en el entorno.`, 0 ids de Resend en ese boot. Filas de prueba eliminadas al final via MCP.
- [x] En `dev:mock` el flujo del modal es client-side sin cambios (sin POST, sin email) y los perfiles mock no se alteran (sin regresión SPEC 14).
  - ✅ Verificado (16 nov 2026): `npm run dev:mock` → perfil `/kids/1` con filas mock "Lucía Fernández ACTIVA / Diego Fernández PENDIENTE"; submit del modal agregó "Test Mock Spec15 · Papá · test.mock@ejemplo.com PENDIENTE" solo en memoria (`browser_network_requests` = 0 requests no estáticas en el flujo, sin POST); recarga → filas mock intactas y la fila desaparece (`.playwright-mcp/spec15-mock-modal-row.png`, `spec15-mock-recargado.png`).
- [x] `/activar-cuenta?code=XA2WC&email=padre@correo.com` llega con esos dos campos prellenados y la contraseña vacía.
  - ✅ Verificado (16 nov 2026): a11y snapshot — `textbox "XXXXX": XA2WC`, `textbox "correo@ejemplo.com": padre@correo.com`, contraseña vacía, tarjeta "—" (código inexistente); capturas `.playwright-mcp/spec15-activar-prefill-1280.png` y móvil `spec15-activar-375.png`.
- [x] Activación inválida (código inexistente, código expirado, email que no coincide, contraseña < 6, checkbox sin marcar) muestra su mensaje inline y no crea cuenta, perfil, vínculo ni cambio de estado en la DB.
  - ✅ Verificado (16 nov 2026): los 5 casos con sus mensajes exactos — "Código de invitación inválido." (XA2WC), "La invitación expiró. Pedile a la guardería una nueva." (fila temporal `EXPI1` con `expires_at` en el pasado, insertada y eliminada via MCP), "El email no coincide con la invitación." (YX6QW + otro@correo.com), "La contraseña debe tener al menos 6 caracteres." y "Debés autorizar para continuar." (capturas `.playwright-mcp/spec15-error-*.png`); DB tras los 5: `YX6QW` seguía `pending`, `count(parent_children) = 1`, `count(auth.users +spec15a) = 0`.
- [x] Activación de email nuevo crea: usuario confirmado en `auth.users`, perfil en `public.users` con `role='parent'` y el `daycare_id` del niño (vía room), fila en `parent_children`, invitación `accepted` con `accepted_at`; termina en `/login?activada=1` con el mensaje de éxito, y el login con la contraseña creada entra.
  - ✅ Verificado (16 nov 2026): flujo A con `+spec15a`/YX6QW → redirect a `/login?activada=1` con banner "Tu cuenta quedó lista. Iniciá sesión con tu email y contraseña." (`.playwright-mcp/spec15-login-activada-banner.png`); MCP: usuario de `auth.users` confirmado (email_confirmed_at y confirmed_at set), perfil `role='parent'` con `daycare_id dd2f1776…` (el de Sala Lunas vía room) y `full_name='Lucía Spec15'` (trigger SPEC 09), fila `parent_children` (parent ↔ Uma, father), invitación `accepted` con `accepted_at 21:35:26`; login con la contraseña creada entró al feed (`.playwright-mcp/spec15-login-parent-exitoso.png`).
- [x] Activación de un email ya registrado con la invitación de su 2º niño NO crea segunda cuenta: agrega la fila `parent_children` (mismo `parent_id`, 2 `child_id`) y marca la invitación accepted.
  - ✅ Verificado (16 nov 2026): flujo B con `+spec15a`/NYTMU (Angela) → redirect a `/login?activada=1&existente=1` con banner "Ya tenías cuenta: iniciá sesión para ver a tu familia." (`.playwright-mcp/spec15-login-activada-existente.png`; en el E2E el proxy de SPEC 10 rebotó a `/` porque había sesión staff en el navegador — comportamiento esperado — y el banner se verificó visitando la URL sin sesión); MCP: `count(auth.users +spec15a) = 1` (sin segunda cuenta), `parent_children` con el mismo `parent_id` y 2 `child_id` (Uma father + Angela mother), NYTMU `accepted` con `accepted_at`.
- [x] El perfil real del niño muestra las filas ACTIVA (desde `parent_children`) y PENDIENTE (desde `invitations` vigentes) con el formato del mock; tras enviar una invitación la lista se actualiza sin recarga manual (`router.refresh()`).
  - ✅ Verificado (16 nov 2026): perfil de Uma → filas ACTIVA "Mariano · Papá · mariano.maciasgandulfo@gmail.com" y "Lucía Spec15 · Papá · mariano.maciasgandulfo+spec15a@gmail.com" (email real vía `auth.admin.getUserById`), orden por `created_at` desc; fila PENDIENTE "Test Sin API Key · Papá · +spec15b" visible tras una invitación cuyo email falló (`.playwright-mcp/spec15-perfil-uma-activas.png`, `spec15-perfil-uma-mixto-1280.png`); tras cada envío exitoso el toast aparece y la fila nueva llega con `router.refresh()` sin recarga manual (`browser_wait_for("PENDIENTE")` pasó inmediatamente tras el submit). Formato idéntico al mock de SPEC 06 (avatar con inicial, `{parentesco} · {email}`, badge ACTIVA/PENDIENTE).
- [x] Consola 0 errores / 0 warnings en las pantallas tocadas a 1280px y 375px en las cargas verificadas.
  - ✅ Verificado (16 nov 2026): `browser_console_messages` — modo real: "Total messages: 15 (Errors: 0, Warnings: 0)" acumulado en /, /kids/[id], /activar-cuenta, /login a 1280px y 375px; modo mock: "Total messages: 2 (Errors: 0, Warnings: 0)". Capturas 375px: `.playwright-mcp/spec15-perfil-uma-375.png` y `spec15-activar-375.png`.

## Decisiones

- **Sí: una única spec** (decisión del usuario) vs dividir DB/app. El entregable principal es el flujo de la app; las migraciones viajan dentro con el patrón de SPEC 09 (numeración confirmada contra el historial, un paso = un estado consistente).
- **Sí: Resend con dominio verificado** del usuario (`contacto@marianomaciasgandulfo.com`) vs sandbox `onboarding@resend.dev` (solo podría entregar al email de la propia cuenta de Resend).
- **No: `CONTACT_RECEIVER_EMAIL`** (el usuario la mencionó de otro proyecto): es la casilla receptora de un form de contacto; aquí el destinatario es el email del padre. No se agrega a `.env.example`.
- **Sí: branding ligero en el email** (decisión del usuario) vs texto plano: CSS inline simple, colores de marca y botón al CTA; sin split-panel ni logo complejo (los clientes de correo recortan CSS avanzado).
- **Sí: prefill por query params** (decisión del usuario): el mockup ya muestra código y email prellenados; el link del email es la forma natural de llegar.
- **Sí: expiración validada al usar el código** (decisión del usuario) vs cron: sin UI que muestre el estado `expired`, marcar filas por lote no agrega valor; la fila queda `pending` pero inutilizable si venció.
- **Sí: reinvitar cancela la previa y regenera** (decisión del usuario, basada en "si expiró se genera de nuevo"): el staff nunca ve un error por duplicado; siempre queda exactamente 1 invitación vigente por email+niño.
- **Sí: un padre puede vincularse a N niños** (decisión del usuario): solo se bloquea el mismo email para el MISMO niño ya vinculado (mensaje con el nombre del niño); vínculos a otros niños no interfieren.
- **Sí: flujo B sin segunda cuenta** para el padre con 2º niño: `signUp` fallaría con email existente y pedir la contraseña existente rompe el mockup ("CREAR CONTRASEÑA"); la posesión del código enviado a ese email acredita ownership, así que se crea solo el vínculo.
- **Sí: el código se genera en el client al abrir el modal** (SPEC 06) y el server solo verifica unicidad: la caja amarilla siempre muestra el código real que se envía por correo; una colisión (31^5 de espacio) se regenera server-side.
- **Sí: invitación primero, email después** (orden fijo): Resend y Postgres no comparten transacción; si el email falla, la fila `pending` permite reinvitar (cancela y regenera) — la alternativa (email primero) dejaría correos con códigos inexistentes.
- **Sí: bloque PADRES VINCULADOS lee de la DB en modo real** (decisión del usuario): una invitación persistida que desaparece al recargar sería mentira; ACTIVA desde `parent_children` y PENDIENTE desde `invitations`.
- **Sí: consentimiento validado sin persistir** (decisión del usuario): el schema no define columna de consentimiento en `users`; agregarla es otra decisión que esta spec no toma.
- **Sí: desactivar "Confirm email" de Supabase** (decisión del usuario): el email ya se valida con la invitación; evita el doble correo y el bloqueo "email not confirmed" en el login. Paso manual en el dashboard, verificado por comportamiento.
- **Sí: `signOut()` inmediato tras `signUp`** en el flujo A: con confirmaciones desactivadas `signUp` devuelve sesión, y el proxy de SPEC 10 redirigiría `/login → /`; cerrarla hace que el redirect a `/login?activada=1` muestre el login limpio.
- **Sí: admin client para todas las lecturas/escrituras de esta spec** (patrón SPEC 12): RLS queda on sin policies; las policies por rol se diseñan en su propia spec.
- **Sí: URL absoluta del email desde `headers()`** vs variable de entorno nueva: el host de la request es suficiente y evita config extra.

## Riesgos

| Riesgo                                                                                                                                  | Mitigación                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin `RESEND_API_KEY` configurada el build no falla pero todo envío falla en runtime                                                     | Mensaje inline claro en el modal; `.env.example` documenta la variable; criterio dedicado verifica el mensaje.                                                      |
| Los emails pueden caer en spam del destinatario                                                                                         | Dominio verificado del usuario; verificación manual pidiendo revisar bandeja/spam en el E2E; documentado como paso manual.                                          |
| `signUp` contra un email existente puede devolver éxito ofuscado en algunas configuraciones de Supabase en vez de `user_already_exists` | Detectar el caso verificando si el usuario existe antes de `signUp` (lookup admin por email) y elegir flujo A/B explícitamente; el criterio E2E cubre ambos flujos. |
| Colisión de `code` UNIQUE en el insert                                                                                                  | El server regenera y reintenta (máx. 5 intentos) y devuelve el código final; improbable con 31^5.                                                                   |
| `getUserById` por cada padre ACTIVA agrega latencia N+1 al perfil                                                                       | N es chico (padres por niño); si crece, pasar a `admin.listUsers` una vez por página — decisión de implementación, no de spec.                                      |
| `/login` pasa de estática a dinámica por `searchParams` (cacheComponents)                                                               | Aceptado: es un banner condicional por request; el build lo re-clasifica y los criterios verifican que no rompe nada más.                                           |
| El proxy de SPEC 10 redirige `/login → /` con sesión activa                                                                             | El flujo A hace `signOut()` antes del redirect; el flujo B nunca crea sesión.                                                                                       |

## Qué **no** está en esta spec

- El feed de familia y la experiencia del padre tras iniciar sesión.
- Policies de RLS (tablas nuevas quedan RLS on, deniegan todo).
- Autorización por rol (el padre podría entrar al feed de staff — otra spec).
- UI de cancelar/eliminar invitaciones o vínculos, edición de padres.
- Cron de expiración, rate limiting, botón "reenviar".
- Modificación de `references/pantallas/`.

Cada uno de esos, si aterriza, va en su propia spec.
