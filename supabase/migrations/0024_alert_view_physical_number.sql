-- =====================================================================
-- NetLog — 0024_alert_view_physical_number.sql
-- Surfaces physical_number on the net alert view too (Dashboard and
-- Notification Center both read from it), appended at the end since
-- CREATE OR REPLACE VIEW can't reorder existing columns.
-- =====================================================================

create or replace view v_net_alert_status as
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
  end as alert_color,
  n.physical_number
from net_installations ni
join nets n on n.id = ni.net_id
join cages c on c.id = ni.cage_id
join sites s on s.id = n.site_id
where ni.removal_date is null;
