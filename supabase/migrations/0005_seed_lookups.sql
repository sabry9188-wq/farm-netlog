-- =====================================================================
-- NetLog — 0005_seed_lookups.sql
-- Sites, cages, and admin-editable lookup tables, seeded to match the
-- farm's real structure (spec sections 1, 2, 46). Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Sites
-- ---------------------------------------------------------------------

insert into sites (site_name, site_code, cage_diameter_m, cage_depth_m) values
  ('Station-05 Cage Farm', 'ST05', 15, 8),
  ('Offshore Cage Farm', 'OFFS', 20, 10)
on conflict (site_code) do nothing;

-- ---------------------------------------------------------------------
-- Cages — Station-05: C01..C20, Offshore: OC01..OC24
-- ---------------------------------------------------------------------

insert into cages (cage_code, site_id, diameter_m, depth_m, status)
select 'C' || lpad(i::text, 2, '0'), s.id, s.cage_diameter_m, s.cage_depth_m, 'Active'
from generate_series(1, 20) i, sites s
where s.site_code = 'ST05'
on conflict (cage_code) do nothing;

insert into cages (cage_code, site_id, diameter_m, depth_m, status)
select 'OC' || lpad(i::text, 2, '0'), s.id, s.cage_diameter_m, s.cage_depth_m, 'Active'
from generate_series(1, 24) i, sites s
where s.site_code = 'OFFS'
on conflict (cage_code) do nothing;

-- ---------------------------------------------------------------------
-- Mesh sizes (per-site standard sizes, spec sections 1 & 2)
-- ---------------------------------------------------------------------

insert into mesh_sizes (site_id, label, sort_order)
select s.id, m.label, m.sort_order
from sites s
join (values ('6 mm', 1), ('10 mm', 2), ('12 mm', 3), ('22 mm', 4), ('80 mm (Guard)', 5)) as m(label, sort_order) on true
where s.site_code = 'ST05';

insert into mesh_sizes (site_id, label, sort_order)
select s.id, m.label, m.sort_order
from sites s
join (values ('10 mm', 1), ('15 mm', 2), ('22 mm', 3), ('80 mm (Guard)', 4)) as m(label, sort_order) on true
where s.site_code = 'OFFS';

-- ---------------------------------------------------------------------
-- Net conditions (spec section 6)
-- ---------------------------------------------------------------------

insert into net_conditions (label, sort_order) values
  ('New', 1), ('Excellent', 2), ('Good', 3), ('Fair', 4),
  ('Poor', 5), ('Damaged', 6), ('Requires Repair', 7), ('Beyond Repair', 8)
on conflict (label) do nothing;

-- ---------------------------------------------------------------------
-- Net statuses (spec section 7) — label + display color key
-- ---------------------------------------------------------------------

insert into net_statuses (label, color, sort_order) values
  ('Available in Store', 'green', 1),
  ('Installed in Cage', 'blue', 2),
  ('Sent for Cleaning', 'purple', 3),
  ('Under Cleaning', 'purple', 4),
  ('Ready for Use', 'green', 5),
  ('Under Repair', 'orange', 6),
  ('Ready After Repair', 'green', 7),
  ('Reserved', 'blue', 8),
  ('Lost', 'grey', 9),
  ('Damaged', 'red', 10),
  ('Beyond Repair', 'red', 11),
  ('Disposed', 'grey', 12)
on conflict (label) do nothing;

-- ---------------------------------------------------------------------
-- Removal reasons (spec section 14)
-- ---------------------------------------------------------------------

insert into removal_reasons (label, sort_order) values
  ('Scheduled 60-day change', 1),
  ('Cleaning', 2),
  ('Repair', 3),
  ('Damaged', 4),
  ('Fish size change', 5),
  ('Mesh size change', 6),
  ('Cage maintenance', 7),
  ('Emergency replacement', 8),
  ('Other', 9)
on conflict (label) do nothing;

-- ---------------------------------------------------------------------
-- Repair types (spec section 16)
-- ---------------------------------------------------------------------

insert into repair_types (label, sort_order) values
  ('Mesh repair', 1), ('Rope repair', 2), ('Seam repair', 3),
  ('Panel replacement', 4), ('Float line repair', 5), ('Sink line repair', 6), ('Other', 7)
on conflict (label) do nothing;

-- ---------------------------------------------------------------------
-- Disposal reasons (spec section 26)
-- ---------------------------------------------------------------------

insert into disposal_reasons (label, sort_order) values
  ('Beyond repair', 1), ('Severe damage', 2), ('Excessive wear', 3),
  ('Lost', 4), ('Expired/unusable', 5), ('Other', 6)
on conflict (label) do nothing;

-- ---------------------------------------------------------------------
-- System settings (spec section 45) — defaults, editable from Settings
-- ---------------------------------------------------------------------

insert into system_settings (key, value, description) values
  ('net_change_period_days', '60', 'Maximum days a main cage net may stay installed before it must be changed'),
  ('warning_days_green_to_yellow', '14', 'Days remaining threshold: at or below this, alert turns yellow'),
  ('warning_days_yellow_to_orange', '7', 'Days remaining threshold: at or below this, alert turns orange'),
  ('warning_days_lookahead', '30', 'How many days ahead the "due soon" dashboard widget looks')
on conflict (key) do nothing;
