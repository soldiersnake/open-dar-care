-- SPEC 09 · 0003 — Create enum types used by the `users` table
-- Source of truth: 07-DB-Schema/opendaycare-database-schema.md (ENUMs section)

create type public.user_role as enum ('staff', 'parent', 'admin');

create type public.user_status as enum ('pending', 'active');

comment on type public.user_role is
  'Rol del usuario: staff (personal de la guardería), parent (padre/tutor) o admin (administrador).';

comment on type public.user_status is
  'Estado del usuario: pending (recién creado, pendiente de actividad) o active (activo). El estado previo al signup se modela en invitations.';
