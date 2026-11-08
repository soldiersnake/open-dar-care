-- SPEC 09 · 0005 — Seed: 1 test staff user (auth.users row; the on_auth_user_created
-- trigger creates the matching profile in public.users).
-- Test credentials: staff@opendaycare.test / DayCare2026! (persisted hashed, never in plain text)
-- The daycare id is resolved by name inside the same statement (daycare ids are gen_random_uuid()).
-- The flow-token columns (email_change*, reauthentication_token, phone_change_token, etc.)
-- are set to '' because normal Auth flows never leave them NULL: GoTrue requires
-- non-NULL strings there and returns 500 unexpected_failure when loading a row with NULLs.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  reauthentication_token,
  phone_change_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid (),
  'authenticated',
  'authenticated',
  'staff@opendaycare.test',
  crypt ('DayCare2026!', gen_salt ('bf', 10)),
  now (),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object (
    'daycare_id', d.id,
    'role', 'staff',
    'full_name', 'Ana Martínez'
  ),
  now (),
  now (),
  '',
  '',
  '',
  '',
  '',
  '',
  ''
from public.daycares d
where d.name = 'Guardería Sala Soles';
