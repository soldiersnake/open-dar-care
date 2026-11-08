-- Post-SPEC 10 · 0006 — RLS policies mínimas para el perfil del usuario logeado.
-- users: el usuario ve su propia fila (select self con predicado de ownership, nunca
-- "TO authenticated" sin predicado — patrón BOLA de las mejores prácticas de Supabase).
-- daycares: el usuario puede leer su propia guardería (la app muestra el nombre en el sidebar).
-- Verificado con auth.uid() envuelto en subconsulta para evitar recomputación por fila.

create policy "users_select_own_profile"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "daycares_select_own_daycare"
  on public.daycares
  for select
  to authenticated
  using (exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = daycares.id
  ));
