-- =====================================================================
-- NetLog — 0001_schema.sql
-- Core schema: extensions, enums, tables, indexes.
-- Run this first, in the Supabase SQL editor, on a fresh project.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type user_role as enum ('admin', 'storekeeper', 'supervisor', 'viewer');
create type net_category as enum ('MAIN_NET', 'GUARD_NET', 'TOP_NET');
create type user_status as enum ('active', 'inactive');

-- ---------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'viewer',
  status user_status not null default 'active',
  can_approve_disposal boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------

create table sites (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  site_code text not null unique,
  cage_diameter_m numeric(6, 2) not null,
  cage_depth_m numeric(6, 2) not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- cages
-- ---------------------------------------------------------------------

create table cages (
  id uuid primary key default gen_random_uuid(),
  cage_code text not null unique,
  site_id uuid not null references sites (id) on delete restrict,
  diameter_m numeric(6, 2) not null,
  depth_m numeric(6, 2) not null,
  species text,
  avg_fish_weight_g numeric(10, 2),
  stocking_date date,
  production_stage text,
  status text not null default 'Active',
  current_main_net_id uuid,
  current_guard_net_id uuid,
  current_top_net_id uuid,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Admin-editable lookup tables (spec section 45)
-- ---------------------------------------------------------------------

create table mesh_sizes (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites (id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table net_conditions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table net_statuses (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  color text not null default 'grey',
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table removal_reasons (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table repair_types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table disposal_reasons (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- system_settings — key/value config (net change period, thresholds, etc.)
-- ---------------------------------------------------------------------

create table system_settings (
  key text primary key,
  value text not null,
  description text
);

-- ---------------------------------------------------------------------
-- stock_thresholds — low stock alerting (spec section 38)
-- ---------------------------------------------------------------------

create table stock_thresholds (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  category net_category not null default 'MAIN_NET',
  mesh_size text not null,
  minimum_qty int not null default 0,
  unique (site_id, category, mesh_size)
);

-- ---------------------------------------------------------------------
-- nets — unified asset table for MAIN_NET / GUARD_NET / TOP_NET
-- ---------------------------------------------------------------------

create table nets (
  id uuid primary key default gen_random_uuid(),
  net_code text not null unique,
  category net_category not null,
  site_id uuid not null references sites (id) on delete restrict,
  mesh_size text,
  diameter_m numeric(6, 2),
  depth_m numeric(6, 2),
  length_m numeric(6, 2),
  width_m numeric(6, 2),
  material text,
  manufacturer text,
  supplier text,
  purchase_date date,
  purchase_cost numeric(12, 2),
  is_new boolean not null default true,
  condition text not null default 'New',
  status text not null default 'Available in Store',
  current_location text not null default 'Net Store',
  current_cage_id uuid references cages (id) on delete set null,
  remarks text,
  is_demo boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_nets_category on nets (category);
create index idx_nets_site on nets (site_id);
create index idx_nets_status on nets (status);
create index idx_nets_mesh on nets (mesh_size);
create index idx_nets_current_cage on nets (current_cage_id);

alter table cages
  add constraint fk_cages_main_net foreign key (current_main_net_id) references nets (id) on delete set null,
  add constraint fk_cages_guard_net foreign key (current_guard_net_id) references nets (id) on delete set null,
  add constraint fk_cages_top_net foreign key (current_top_net_id) references nets (id) on delete set null;

-- ---------------------------------------------------------------------
-- net_installations — one row per cage assignment period
-- ---------------------------------------------------------------------

create table net_installations (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets (id) on delete restrict,
  cage_id uuid not null references cages (id) on delete restrict,
  installation_date date not null,
  expected_change_date date not null,
  removal_date date,
  removal_reason text,
  condition_at_installation text,
  condition_at_removal text,
  destination text,
  installed_by uuid references profiles (id),
  removed_by uuid references profiles (id),
  remarks text,
  created_at timestamptz not null default now()
);

-- At most one OPEN (removal_date is null) installation per net, and per cage
-- per net_category — this is what makes double-installation structurally
-- impossible rather than just app-checked.
create unique index uidx_installations_open_net
  on net_installations (net_id)
  where removal_date is null;

create index idx_installations_cage on net_installations (cage_id);
create index idx_installations_net on net_installations (net_id);
create index idx_installations_open on net_installations (cage_id) where removal_date is null;

-- ---------------------------------------------------------------------
-- net_movements — append-only movement ledger
-- ---------------------------------------------------------------------

create table net_movements (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets (id) on delete restrict,
  movement_date timestamptz not null default now(),
  from_location text,
  to_location text not null,
  from_status text,
  to_status text not null,
  cage_id uuid references cages (id),
  reason text,
  performed_by uuid references profiles (id),
  remarks text,
  created_at timestamptz not null default now()
);

create index idx_movements_net on net_movements (net_id, movement_date);

-- ---------------------------------------------------------------------
-- cleaning_records
-- ---------------------------------------------------------------------

create table cleaning_records (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets (id) on delete restrict,
  start_date date not null,
  completion_date date,
  method text,
  condition_before text,
  condition_after text,
  performed_by uuid references profiles (id),
  remarks text,
  created_at timestamptz not null default now()
);

create index idx_cleaning_net on cleaning_records (net_id);
create unique index uidx_cleaning_open_net
  on cleaning_records (net_id)
  where completion_date is null;

-- ---------------------------------------------------------------------
-- repair_records
-- ---------------------------------------------------------------------

create table repair_records (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets (id) on delete restrict,
  damage_description text,
  repair_start date not null,
  repair_completion date,
  repair_type text,
  cost numeric(12, 2),
  performed_by text,
  condition_before text,
  condition_after text,
  outcome text, -- 'Ready for Use' | 'Beyond Repair' (set on completion)
  remarks text,
  created_at timestamptz not null default now()
);

create index idx_repair_net on repair_records (net_id);
create unique index uidx_repair_open_net
  on repair_records (net_id)
  where repair_completion is null;

-- ---------------------------------------------------------------------
-- disposal_records
-- ---------------------------------------------------------------------

create table disposal_records (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets (id) on delete restrict,
  disposal_date date not null,
  reason text,
  condition text,
  method text,
  approved_by uuid references profiles (id),
  performed_by text,
  remarks text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- lost_records
-- ---------------------------------------------------------------------

create table lost_records (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets (id) on delete restrict,
  date_lost date not null,
  last_known_location text,
  reason text,
  reported_by uuid references profiles (id),
  approved_by uuid references profiles (id),
  remarks text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- id sequence counters (per site + category, main/guard/top nets)
-- ---------------------------------------------------------------------

create table net_code_counters (
  site_code text not null,
  category net_category not null,
  last_value int not null default 0,
  primary key (site_code, category)
);

-- ---------------------------------------------------------------------
-- audit_logs — append-only, never deleted by non-admins
-- ---------------------------------------------------------------------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id),
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_entity on audit_logs (entity_type, entity_id);
create index idx_audit_created on audit_logs (created_at desc);
