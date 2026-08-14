-- =====================================================================
-- NetLog — 0006_seed_demo_data.sql
-- Demonstration data (spec section 49): a modest set of installed,
-- store, cleaning, repair, disposed and lost nets so every dashboard
-- and report can be exercised immediately after setup. Every row this
-- file creates is tagged with remarks = '[DEMO DATA]' and nets.is_demo
-- = true, so it can be found and deleted later with:
--   delete from nets where is_demo = true;
-- (cascades are `restrict`, so remove dependent installations /
-- movements / cleaning / repair / disposal / lost records for those
-- net ids first, or delete in the order shown at the bottom of this
-- file.)
--
-- This file inserts directly into tables (as the Postgres owner, which
-- bypasses RLS in the SQL editor) rather than through the fn_install_net
-- / fn_send_to_cleaning RPCs, because those RPCs check auth.uid()
-- against a real logged-in profile, which doesn't exist yet during
-- initial setup.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Temporary helpers, dropped at the end of this file
-- ---------------------------------------------------------------------

create or replace function _seed_install_net(
  p_category net_category, p_site_id uuid, p_cage_code text, p_mesh text,
  p_days_ago int, p_condition text default 'Good', p_purchase_days_ago int default 400
) returns uuid language plpgsql as $$
declare
  v_net_id uuid;
  v_cage_id uuid;
  v_period int := 60;
begin
  select id into v_cage_id from cages where cage_code = p_cage_code;

  insert into nets (
    category, site_id, mesh_size, material, manufacturer, supplier,
    purchase_date, purchase_cost, is_new, condition, status, current_location,
    current_cage_id, remarks, is_demo
  ) values (
    p_category, p_site_id, p_mesh, 'HDPE knotless', 'AquaNet Manufacturing', 'AquaNet Manufacturing',
    current_date - (p_purchase_days_ago || ' days')::interval, 1200, false, p_condition,
    'Installed in Cage', p_cage_code, v_cage_id, '[DEMO DATA]', true
  ) returning id into v_net_id;

  insert into net_installations (net_id, cage_id, installation_date, expected_change_date, condition_at_installation, remarks)
  values (
    v_net_id, v_cage_id,
    current_date - (p_days_ago || ' days')::interval,
    current_date - (p_days_ago || ' days')::interval + v_period,
    p_condition, '[DEMO DATA]'
  );

  if p_category = 'MAIN_NET' then
    update cages set current_main_net_id = v_net_id where id = v_cage_id;
  elsif p_category = 'GUARD_NET' then
    update cages set current_guard_net_id = v_net_id where id = v_cage_id;
  else
    update cages set current_top_net_id = v_net_id where id = v_cage_id;
  end if;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, cage_id, reason, remarks)
  values (v_net_id, 'Net Store', p_cage_code, 'Available in Store', 'Installed in Cage', v_cage_id, 'Net installation', '[DEMO DATA]');

  return v_net_id;
end;
$$;

create or replace function _seed_store_net(
  p_category net_category, p_site_id uuid, p_mesh text,
  p_status text default 'Available in Store', p_condition text default 'Good'
) returns uuid language plpgsql as $$
declare
  v_net_id uuid;
begin
  insert into nets (
    category, site_id, mesh_size, material, manufacturer, supplier,
    purchase_date, purchase_cost, is_new, condition, status, current_location, remarks, is_demo
  ) values (
    p_category, p_site_id, p_mesh, 'HDPE knotless', 'AquaNet Manufacturing', 'AquaNet Manufacturing',
    current_date - interval '200 days', 900, false, p_condition, p_status, 'Net Store', '[DEMO DATA]', true
  ) returning id into v_net_id;

  insert into net_movements (net_id, from_location, to_location, to_status, reason, remarks)
  values (v_net_id, null, 'Net Store', p_status, 'Net registered', '[DEMO DATA]');

  return v_net_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Main seeding block
-- ---------------------------------------------------------------------

do $$
declare
  v_st05 uuid;
  v_offs uuid;
  v_hist_net uuid;
  v_clean_net uuid;
  v_repair_net uuid;
  v_disposed_net uuid;
  v_lost_net uuid;
begin
  select id into v_st05 from sites where site_code = 'ST05';
  select id into v_offs from sites where site_code = 'OFFS';

  -- === Station-05: main nets installed, covering every alert color ===
  perform _seed_install_net('MAIN_NET', v_st05, 'C01', '10 mm', 65, 'Good');       -- red: overdue
  perform _seed_install_net('MAIN_NET', v_st05, 'C02', '10 mm', 53, 'Good');       -- orange: 7 days left
  perform _seed_install_net('MAIN_NET', v_st05, 'C03', '6 mm', 48, 'Excellent');   -- yellow: 12 days left
  perform _seed_install_net('MAIN_NET', v_st05, 'C04', '12 mm', 10, 'Excellent');  -- green: 50 days left
  -- C05 intentionally left with no main net (grey / missing-net demo)

  -- Guard + top nets for C01-C04
  perform _seed_install_net('GUARD_NET', v_st05, 'C01', '80 mm (Guard)', 65, 'Good');
  perform _seed_install_net('GUARD_NET', v_st05, 'C02', '80 mm (Guard)', 53, 'Good');
  perform _seed_install_net('GUARD_NET', v_st05, 'C03', '80 mm (Guard)', 48, 'Good');
  perform _seed_install_net('GUARD_NET', v_st05, 'C04', '80 mm (Guard)', 10, 'Excellent');
  perform _seed_install_net('TOP_NET', v_st05, 'C01', null, 65, 'Good');
  perform _seed_install_net('TOP_NET', v_st05, 'C02', null, 53, 'Good');
  perform _seed_install_net('TOP_NET', v_st05, 'C03', null, 48, 'Good');
  perform _seed_install_net('TOP_NET', v_st05, 'C04', null, 10, 'Excellent');

  -- C06: full lifecycle history — a completed installation, then a
  -- second (current) net, so "Previous Net History" has a real row.
  insert into nets (
    category, site_id, mesh_size, material, manufacturer, supplier,
    purchase_date, purchase_cost, is_new, condition, status, current_location, remarks, is_demo
  ) values (
    'MAIN_NET', v_st05, '10 mm', 'HDPE knotless', 'AquaNet Manufacturing', 'AquaNet Manufacturing',
    current_date - interval '500 days', 1150, false, 'Fair', 'Available in Store', 'Net Store', '[DEMO DATA]', true
  ) returning id into v_hist_net;

  insert into net_installations (
    net_id, cage_id, installation_date, expected_change_date, removal_date,
    removal_reason, condition_at_installation, condition_at_removal, destination, remarks
  ) values (
    v_hist_net, (select id from cages where cage_code = 'C06'),
    current_date - interval '120 days', current_date - interval '60 days', current_date - interval '61 days',
    'Scheduled 60-day change', 'Good', 'Fair', 'Net Store', '[DEMO DATA]'
  );

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, cage_id, reason, remarks) values
    (v_hist_net, 'Net Store', 'C06', 'Available in Store', 'Installed in Cage', (select id from cages where cage_code = 'C06'), 'Net installation', '[DEMO DATA]'),
    (v_hist_net, 'C06', 'Net Store', 'Installed in Cage', 'Available in Store', (select id from cages where cage_code = 'C06'), 'Scheduled 60-day change', '[DEMO DATA]');

  perform _seed_install_net('MAIN_NET', v_st05, 'C06', '12 mm', 20, 'Excellent'); -- current net in C06

  -- === Offshore: main nets installed ===
  perform _seed_install_net('MAIN_NET', v_offs, 'OC01', '10 mm', 63, 'Fair');     -- red: 3 days overdue
  perform _seed_install_net('MAIN_NET', v_offs, 'OC02', '15 mm', 60, 'Good');     -- red: due today
  perform _seed_install_net('MAIN_NET', v_offs, 'OC03', '22 mm', 15, 'Excellent'); -- green
  perform _seed_install_net('GUARD_NET', v_offs, 'OC01', '80 mm (Guard)', 63, 'Fair');
  perform _seed_install_net('TOP_NET', v_offs, 'OC01', null, 63, 'Fair');
  -- OC04 gets guard + top but no main net yet (missing-main-net demo)
  perform _seed_install_net('GUARD_NET', v_offs, 'OC04', '80 mm (Guard)', 5, 'Excellent');
  perform _seed_install_net('TOP_NET', v_offs, 'OC04', null, 5, 'Excellent');

  -- === Store stock — a spread of mesh sizes at both sites ===
  perform _seed_store_net('MAIN_NET', v_st05, '6 mm', 'Available in Store', 'Good');
  perform _seed_store_net('MAIN_NET', v_st05, '10 mm', 'Available in Store', 'Excellent');
  perform _seed_store_net('MAIN_NET', v_st05, '10 mm', 'Ready for Use', 'Good');
  perform _seed_store_net('MAIN_NET', v_st05, '12 mm', 'Available in Store', 'Good');
  perform _seed_store_net('MAIN_NET', v_st05, '22 mm', 'Available in Store', 'New');
  perform _seed_store_net('MAIN_NET', v_offs, '10 mm', 'Available in Store', 'Good');
  perform _seed_store_net('MAIN_NET', v_offs, '15 mm', 'Available in Store', 'Excellent');
  perform _seed_store_net('MAIN_NET', v_offs, '22 mm', 'Ready for Use', 'Good');
  perform _seed_store_net('GUARD_NET', v_st05, '80 mm (Guard)', 'Available in Store', 'Good');
  perform _seed_store_net('TOP_NET', v_st05, null, 'Available in Store', 'Good');
  perform _seed_store_net('GUARD_NET', v_offs, '80 mm (Guard)', 'Available in Store', 'Good');
  perform _seed_store_net('TOP_NET', v_offs, null, 'Available in Store', 'Good');

  -- === Under Cleaning ===
  insert into nets (
    category, site_id, mesh_size, material, manufacturer, supplier,
    purchase_date, purchase_cost, is_new, condition, status, current_location, remarks, is_demo
  ) values (
    'MAIN_NET', v_st05, '10 mm', 'HDPE knotless', 'AquaNet Manufacturing', 'AquaNet Manufacturing',
    current_date - interval '300 days', 1150, false, 'Fair', 'Under Cleaning', 'Cleaning', '[DEMO DATA]', true
  ) returning id into v_clean_net;
  insert into cleaning_records (net_id, start_date, method, condition_before, remarks)
  values (v_clean_net, current_date - interval '1 day', 'Pressure wash', 'Fair', '[DEMO DATA]');
  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, remarks)
  values (v_clean_net, 'Net Store', 'Cleaning', 'Available in Store', 'Under Cleaning', 'Sent for cleaning', '[DEMO DATA]');

  -- === Under Repair ===
  insert into nets (
    category, site_id, mesh_size, material, manufacturer, supplier,
    purchase_date, purchase_cost, is_new, condition, status, current_location, remarks, is_demo
  ) values (
    'MAIN_NET', v_offs, '15 mm', 'HDPE knotless', 'AquaNet Manufacturing', 'AquaNet Manufacturing',
    current_date - interval '350 days', 1400, false, 'Requires Repair', 'Under Repair', 'Repair', '[DEMO DATA]', true
  ) returning id into v_repair_net;
  insert into repair_records (net_id, damage_description, repair_start, repair_type, condition_before, remarks)
  values (v_repair_net, 'Torn panel near float line, approx 1.5m', current_date - interval '2 days', 'Panel replacement', 'Requires Repair', '[DEMO DATA]');
  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, remarks)
  values (v_repair_net, 'Net Store', 'Repair', 'Available in Store', 'Under Repair', 'Torn panel near float line', '[DEMO DATA]');

  -- === Disposed ===
  insert into nets (
    category, site_id, mesh_size, material, manufacturer, supplier,
    purchase_date, purchase_cost, is_new, condition, status, current_location, remarks, is_demo
  ) values (
    'MAIN_NET', v_st05, '6 mm', 'HDPE knotless', 'AquaNet Manufacturing', 'AquaNet Manufacturing',
    current_date - interval '900 days', 980, false, 'Beyond Repair', 'Disposed', 'Disposed', '[DEMO DATA]', true
  ) returning id into v_disposed_net;
  insert into disposal_records (net_id, disposal_date, reason, condition, method, performed_by, remarks)
  values (v_disposed_net, current_date - interval '30 days', 'Excessive wear', 'Beyond Repair', 'Cut up and scrapped', 'Store team', '[DEMO DATA]');
  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, remarks)
  values (v_disposed_net, 'Net Store', 'Disposed', 'Beyond Repair', 'Disposed', 'Excessive wear', '[DEMO DATA]');

  -- === Lost ===
  insert into nets (
    category, site_id, mesh_size, material, manufacturer, supplier,
    purchase_date, purchase_cost, is_new, condition, status, current_location, remarks, is_demo
  ) values (
    'MAIN_NET', v_offs, '10 mm', 'HDPE knotless', 'AquaNet Manufacturing', 'AquaNet Manufacturing',
    current_date - interval '250 days', 1250, false, 'Good', 'Lost', 'OC09 (last seen)', '[DEMO DATA]', true
  ) returning id into v_lost_net;
  insert into lost_records (net_id, date_lost, last_known_location, reason, remarks)
  values (v_lost_net, current_date - interval '14 days', 'OC09', 'Storm — net separated from cage during heavy weather', '[DEMO DATA]');
  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, remarks)
  values (v_lost_net, 'OC09', 'Lost', 'Installed in Cage', 'Lost', 'Storm loss', '[DEMO DATA]');

end $$;

-- ---------------------------------------------------------------------
-- Low-stock thresholds, tuned so at least one demo entry trips the alert
-- ---------------------------------------------------------------------

insert into stock_thresholds (site_id, category, mesh_size, minimum_qty)
select id, 'MAIN_NET', '6 mm', 3 from sites where site_code = 'ST05'
union all
select id, 'MAIN_NET', '10 mm', 4 from sites where site_code = 'ST05'
union all
select id, 'MAIN_NET', '10 mm', 3 from sites where site_code = 'OFFS'
on conflict (site_id, category, mesh_size) do nothing;

-- ---------------------------------------------------------------------
-- Drop the temporary seeding helpers
-- ---------------------------------------------------------------------

drop function _seed_install_net(net_category, uuid, text, text, int, text, int);
drop function _seed_store_net(net_category, uuid, text, text, text);
