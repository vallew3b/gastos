-- ==========================================================================
-- MONSE CUENTAS - Permisos para que la app pueda leer y guardar
-- Ejecutar UNA vez en: Supabase > SQL Editor > New query > Run
-- ==========================================================================

-- Mantener RLS activo, pero con políticas que permitan a la app operar
alter table public.expenses        enable row level security;
alter table public.people          enable row level security;
alter table public.payment_history enable row level security;

grant select, insert, update, delete on public.expenses        to anon, authenticated;
grant select, insert, update, delete on public.people          to anon, authenticated;
grant select, insert, update, delete on public.payment_history to anon, authenticated;

drop policy if exists "app_full_access" on public.expenses;
create policy "app_full_access" on public.expenses
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "app_full_access" on public.people;
create policy "app_full_access" on public.people
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "app_full_access" on public.payment_history;
create policy "app_full_access" on public.payment_history
  for all to anon, authenticated using (true) with check (true);

-- Evitar personas duplicadas
create unique index if not exists people_nombre_unique on public.people (nombre);
