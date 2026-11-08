-- SPEC 11 · 0008 — Seed 3 default rooms for the test daycare
-- Source of truth: 07-DB-Schema/opendaycare-database-schema.md §3 rooms
-- Rooms live in "Guardería Sala Soles" (the daycare of the seeded staff user,
-- SPEC 09); ids are gen_random_uuid(), resolved by name lookup in this statement.

insert into public.rooms (daycare_id, name)
select d.id, s.name
from public.daycares d
cross join (values ('Soles'), ('Lunas'), ('Estrellas')) as s (name)
where d.name = 'Guardería Sala Soles';
