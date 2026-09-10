-- =====================================================================
-- NetLog — 0017_cage_view_physical_number.sql
-- Surfaces each installed net's physical_number (added in 0016) on the
-- cage current-state view, so cage pages can show it alongside the
-- system net code without a separate query. Based on the view as last
-- defined in 0013_category_change_periods.sql — new columns appended
-- at the end, since CREATE OR REPLACE VIEW cannot reorder or drop
-- existing columns.
-- =====================================================================

create or replace view v_cage_current_state as
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
  main_alert.days_remaining as main_net_days_remaining,
  main_alert.alert_color as main_net_alert_color,
  gn.id as guard_net_id,
  gn.net_code as guard_net_code,
  gn.condition as guard_net_condition,
  tn.id as top_net_id,
  tn.net_code as top_net_code,
  tn.condition as top_net_condition,
  case
    when c.current_main_net_id is null then 'grey'
    else coalesce(main_alert.alert_color, 'grey')
  end as cage_status_color,
  gni.installation_date as guard_net_installation_date,
  tni.installation_date as top_net_installation_date,
  gni.expected_change_date as guard_net_expected_change_date,
  guard_alert.days_remaining as guard_net_days_remaining,
  guard_alert.alert_color as guard_net_alert_color,
  mn.physical_number as main_net_physical_number,
  gn.physical_number as guard_net_physical_number,
  tn.physical_number as top_net_physical_number
from cages c
join sites s on s.id = c.site_id
left join nets mn on mn.id = c.current_main_net_id
left join net_installations mni on mni.net_id = mn.id and mni.removal_date is null
left join v_net_alert_status main_alert on main_alert.net_id = mn.id
left join nets gn on gn.id = c.current_guard_net_id
left join net_installations gni on gni.net_id = gn.id and gni.removal_date is null
left join v_net_alert_status guard_alert on guard_alert.net_id = gn.id
left join nets tn on tn.id = c.current_top_net_id
left join net_installations tni on tni.net_id = tn.id and tni.removal_date is null;
