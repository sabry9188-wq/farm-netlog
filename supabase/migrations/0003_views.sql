-- =====================================================================
-- NetLog — 0003_views.sql
-- Read-side views: alert status, cage current state, stock summary,
-- lifecycle stats, low stock, and cages missing a net.
-- =====================================================================

-- ---------------------------------------------------------------------
-- v_net_alert_status — one row per OPEN installation with days remaining
-- and the 60-day alert color (green/yellow/orange/red).
-- ---------------------------------------------------------------------

create view v_net_alert_status as
select
  ni.id as installation_id,
  n.id as net_id,
  n.net_code,
  n.category,
  n.mesh_size,
  n.site_id,
  s.site_code,
  s.site_name,
  c.id as cage_id,
  c.cage_code,
  ni.installation_date,
  ni.expected_change_date,
  (current_date - ni.installation_date) as days_in_water,
  (ni.expected_change_date - current_date) as days_remaining,
  case
    when ni.expected_change_date < current_date then 'red'
    when ni.expected_change_date = current_date then 'red'
    when ni.expected_change_date - current_date <= 7 then 'orange'
    when ni.expected_change_date - current_date <= 14 then 'yellow'
    else 'green'
  end as alert_color
from net_installations ni
join nets n on n.id = ni.net_id
join cages c on c.id = ni.cage_id
join sites s on s.id = n.site_id
where ni.removal_date is null;

-- ---------------------------------------------------------------------
-- v_cage_current_state — each cage with its current main/guard/top net
-- and a single worst-case status color for the cage grid.
-- ---------------------------------------------------------------------

create view v_cage_current_state as
select
  c.id as cage_id,
  c.cage_code,
  c.site_id,
  s.site_code,
  s.site_name,
  c.species,
  c.avg_fish_weight_g,
  c.stocking_date,
  c.production_stage,
  mn.id as main_net_id,
  mn.net_code as main_net_code,
  mn.mesh_size as main_net_mesh,
  mn.condition as main_net_condition,
  mni.installation_date as main_net_installation_date,
  mni.expected_change_date as main_net_expected_change_date,
  alert.days_remaining as main_net_days_remaining,
  alert.alert_color as main_net_alert_color,
  gn.id as guard_net_id,
  gn.net_code as guard_net_code,
  gn.condition as guard_net_condition,
  tn.id as top_net_id,
  tn.net_code as top_net_code,
  tn.condition as top_net_condition,
  case
    when c.current_main_net_id is null then 'grey'
    else coalesce(alert.alert_color, 'grey')
  end as cage_status_color
from cages c
join sites s on s.id = c.site_id
left join nets mn on mn.id = c.current_main_net_id
left join net_installations mni on mni.net_id = mn.id and mni.removal_date is null
left join v_net_alert_status alert on alert.net_id = mn.id
left join nets gn on gn.id = c.current_guard_net_id
left join nets tn on tn.id = c.current_top_net_id;

-- ---------------------------------------------------------------------
-- v_stock_summary — counts by site/category/status, for dashboard KPIs
-- and low-stock evaluation.
-- ---------------------------------------------------------------------

create view v_stock_summary as
select
  n.site_id,
  s.site_code,
  n.category,
  n.mesh_size,
  n.status,
  count(*) as qty
from nets n
join sites s on s.id = n.site_id
group by n.site_id, s.site_code, n.category, n.mesh_size, n.status;

-- ---------------------------------------------------------------------
-- v_low_stock — mesh sizes below their configured minimum, counting
-- only nets that are actually available for use.
-- ---------------------------------------------------------------------

create view v_low_stock as
select
  t.site_id,
  s.site_code,
  t.category,
  t.mesh_size,
  t.minimum_qty,
  coalesce(sum(case when n.status in ('Available in Store','Ready for Use','Ready After Repair') then 1 else 0 end), 0) as current_qty
from stock_thresholds t
join sites s on s.id = t.site_id
left join nets n on n.site_id = t.site_id and n.category = t.category and n.mesh_size = t.mesh_size
group by t.site_id, s.site_code, t.category, t.mesh_size, t.minimum_qty
having coalesce(sum(case when n.status in ('Available in Store','Ready for Use') then 1 else 0 end), 0) < t.minimum_qty;

-- ---------------------------------------------------------------------
-- v_cages_missing_net — cages missing a main, guard, or top net
-- ---------------------------------------------------------------------

create view v_cages_missing_net as
select c.id as cage_id, c.cage_code, c.site_id, s.site_code,
  (c.current_main_net_id is null) as missing_main_net,
  (c.current_guard_net_id is null) as missing_guard_net,
  (c.current_top_net_id is null) as missing_top_net
from cages c
join sites s on s.id = c.site_id
where c.current_main_net_id is null or c.current_guard_net_id is null or c.current_top_net_id is null;

-- ---------------------------------------------------------------------
-- v_net_lifecycle_stats — per-net rollup for the Net Profile page
-- ---------------------------------------------------------------------

create view v_net_lifecycle_stats as
select
  n.id as net_id,
  n.net_code,
  (select count(*) from net_installations ni where ni.net_id = n.id) as total_cage_uses,
  (select coalesce(sum(coalesce(ni.removal_date, current_date) - ni.installation_date), 0)
     from net_installations ni where ni.net_id = n.id) as total_cage_days,
  (select count(*) from cleaning_records cr where cr.net_id = n.id and cr.completion_date is not null) as cleaning_cycles,
  (select count(*) from repair_records rr where rr.net_id = n.id and rr.repair_completion is not null) as repair_cycles,
  (select count(*) from net_movements nm where nm.net_id = n.id) as total_movements,
  (select coalesce(sum(rr.cost), 0) from repair_records rr where rr.net_id = n.id) as total_repair_cost,
  (select min(ni.installation_date) from net_installations ni where ni.net_id = n.id) as first_use_date,
  (select max(coalesce(ni.removal_date, current_date)) from net_installations ni where ni.net_id = n.id) as last_use_date,
  (current_date - n.purchase_date) as net_age_days
from nets n;
