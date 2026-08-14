-- =====================================================================
-- NetLog — 0004_rls.sql
-- Row Level Security. All mutating workflows (install/remove/clean/
-- repair/dispose/lose) run through the SECURITY DEFINER functions in
-- 0002_functions.sql, which run as the table owner and therefore
-- bypass RLS after doing their own explicit role check. The direct
-- table policies below are the second layer: they control (a) plain
-- reads for every screen, and (b) who may write to a table directly
-- (via the Supabase table editor or a raw REST call) outside those
-- functions — generally restricted to Admin, so ad-hoc edits are
-- still possible for corrections but can't bypass business rules
-- through the normal app.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Role-check helpers (SECURITY DEFINER to avoid recursive RLS on profiles)
-- ---------------------------------------------------------------------

create function is_admin() returns boolean
language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create function has_any_role(p_roles user_role[]) returns boolean
language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = any(p_roles) and status = 'active');
$$;

-- ---------------------------------------------------------------------
-- Auto-create a profile row when a new auth user is created.
-- Defaults to 'viewer' — an Admin (or the one-time bootstrap SQL in
-- SETUP.md) promotes the role afterwards.
-- ---------------------------------------------------------------------

create function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------

alter table profiles enable row level security;
alter table sites enable row level security;
alter table cages enable row level security;
alter table mesh_sizes enable row level security;
alter table net_conditions enable row level security;
alter table net_statuses enable row level security;
alter table removal_reasons enable row level security;
alter table repair_types enable row level security;
alter table disposal_reasons enable row level security;
alter table system_settings enable row level security;
alter table stock_thresholds enable row level security;
alter table nets enable row level security;
alter table net_installations enable row level security;
alter table net_movements enable row level security;
alter table cleaning_records enable row level security;
alter table repair_records enable row level security;
alter table disposal_records enable row level security;
alter table lost_records enable row level security;
alter table net_code_counters enable row level security;
alter table audit_logs enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------

create policy profiles_select_all on profiles for select
  using (auth.uid() is not null);
create policy profiles_admin_insert on profiles for insert
  with check (is_admin());
create policy profiles_admin_update on profiles for update
  using (is_admin());
create policy profiles_admin_delete on profiles for delete
  using (is_admin());

-- ---------------------------------------------------------------------
-- sites — Admin manages, everyone reads
-- ---------------------------------------------------------------------

create policy sites_select_all on sites for select
  using (auth.uid() is not null);
create policy sites_admin_write on sites for insert
  with check (is_admin());
create policy sites_admin_update on sites for update
  using (is_admin());
create policy sites_admin_delete on sites for delete
  using (is_admin());

-- ---------------------------------------------------------------------
-- cages — Admin creates; Admin + Supervisor can update production info
-- ---------------------------------------------------------------------

create policy cages_select_all on cages for select
  using (auth.uid() is not null);
create policy cages_admin_insert on cages for insert
  with check (is_admin());
create policy cages_update on cages for update
  using (has_any_role(array['admin','supervisor']::user_role[]));
create policy cages_admin_delete on cages for delete
  using (is_admin());

-- ---------------------------------------------------------------------
-- Lookup / settings tables — Admin manages, everyone reads
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['mesh_sizes','net_conditions','net_statuses','removal_reasons','repair_types','disposal_reasons','system_settings','stock_thresholds']
  loop
    execute format('create policy %I_select_all on %I for select using (auth.uid() is not null);', t, t);
    execute format('create policy %I_admin_insert on %I for insert with check (is_admin());', t, t);
    execute format('create policy %I_admin_update on %I for update using (is_admin());', t, t);
    execute format('create policy %I_admin_delete on %I for delete using (is_admin());', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Transactional tables — everyone (authenticated) reads; direct writes
-- restricted to Admin (normal writes happen via the SECURITY DEFINER
-- workflow functions, which bypass these policies after their own
-- role check).
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['nets','net_installations','net_movements','cleaning_records','repair_records','disposal_records','lost_records','net_code_counters']
  loop
    execute format('create policy %I_select_all on %I for select using (auth.uid() is not null);', t, t);
    execute format('create policy %I_admin_insert on %I for insert with check (is_admin());', t, t);
    execute format('create policy %I_admin_update on %I for update using (is_admin());', t, t);
    execute format('create policy %I_admin_delete on %I for delete using (is_admin());', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- audit_logs — Admin only, read-only from the client (writes happen
-- only through fn_write_audit / the correction trigger, both of which
-- run as the table owner and bypass RLS).
-- ---------------------------------------------------------------------

create policy audit_logs_admin_select on audit_logs for select
  using (is_admin());
