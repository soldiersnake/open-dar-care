-- SPEC 15 · 0010 — Create enum types used by the `invitations` and `parent_children` tables
-- Source of truth: 07-DB-Schema/opendaycare-database-schema.md (ENUMs section)

create type public.relationship_type as enum ('father', 'mother', 'guardian');

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

comment on type public.relationship_type is
  'Parentesco del tutor con el niño: father (padre), mother (madre) o guardian (tutor legal).';

comment on type public.invitation_status is
  'Estado de la invitación: pending (enviada, esperando activación), accepted (usada, vínculo creado), expired (vencida) o cancelled (reemplazada por una reinvitación o anulada).';
