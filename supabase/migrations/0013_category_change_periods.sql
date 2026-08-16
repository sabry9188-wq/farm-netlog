-- =====================================================================
-- NetLog — 0013_category_change_periods.sql
-- Main nets keep the 60-day timer. Guard nets get their own timer,
-- default 120 days (4 months). Top/bird nets are never on a fixed
-- schedule — they're only changed when damaged — so no expected
-- change date is set for them at all, and they're excluded from the
-- 60-day-style alerts.
-- =====================================================================

alter table net_installations alter column expected_change_date drop not null;

insert into system_settings (key, value, description) values
  ('net_change_period_days_guard', '120', 'Maximum days a guard net may stay installed before it must be changed (default 4 months)')
on conflict (key) do nothing;

update system_settings
  set description = 'Maximum days a main cage net may stay installed before it must be changed'
where key = 'net_change_period_days';

-- ---------------------------------------------------------------------
-- fn_install_net / fn_change_net — period depends on category now
-- ---------------------------------------------------------------------

create or replace function fn_install_net(
  p_net_id uuid,
  p_cage_id uuid,
  p_installation_date date default current_date,
  p_remarks text default null
) returns net_installations
language plpgsql security definer as $$
declare
  v_net nets;
  v_cage cages;
  v_period int;
  v_installation net_installations;
begin
  perform fn_require_role(array['admin','manager','farm_specialist','diver','storekeeper']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;

  if v_net.status in ('Disposed','Lost','Under Repair','Sent for Cleaning','Under Cleaning','Beyond Repair') then
    raise exception 'Net % cannot be installed while status is "%"', v_net.net_code, v_net.status;
  end if;

  if exists (select 1 from net_installations where net_id = p_net_id and removal_date is null) then
    raise exception 'Net % already has an open installation', v_net.net_code;
  end if;

  select * into v_cage from cages where id = p_cage_id for update;
  if v_cage is null then raise exception 'Cage not found'; end if;

  if v_net.category = 'MAIN_NET' and v_cage.current_main_net_id is not null then
    raise exception 'Cage % already has an active main net installed', v_cage.cage_code;
  elsif v_net.category = 'GUARD_NET' and v_cage.current_guard_net_id is not null then
    raise exception 'Cage % already has an active guard net installed', v_cage.cage_code;
  elsif v_net.category = 'TOP_NET' and v_cage.current_top_net_id is not null then
    raise exception 'Cage % already has an active top/bird net installed', v_cage.cage_code;
  end if;

  if v_net.category = 'MAIN_NET' then
    v_period := fn_get_setting_int('net_change_period_days', 60);
  elsif v_net.category = 'GUARD_NET' then
    v_period := fn_get_setting_int('net_change_period_days_guard', 120);
  else
    v_period := null; -- top/bird nets: condition-based, not time-based
  end if;

  insert into net_installations (
    net_id, cage_id, installation_date, expected_change_date,
    condition_at_installation, installed_by, remarks
  ) values (
    p_net_id, p_cage_id, p_installation_date,
    case when v_period is null then null else p_installation_date + v_period end,
    v_net.condition, auth.uid(), p_remarks
  ) returning * into v_installation;

  update nets
    set status = 'Installed in Cage', current_location = v_cage.cage_code, current_cage_id = p_cage_id
  where id = p_net_id;

  if v_net.category = 'MAIN_NET' then
    update cages set current_main_net_id = p_net_id where id = p_cage_id;
  elsif v_net.category = 'GUARD_NET' then
    update cages set current_guard_net_id = p_net_id where id = p_cage_id;
  else
    update cages set current_top_net_id = p_net_id where id = p_cage_id;
  end if;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, cage_id, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, v_cage.cage_code, v_net.status, 'Installed in Cage', p_cage_id, 'Net installation', auth.uid(), p_remarks);

  perform fn_write_audit('INSTALL_NET', 'nets', p_net_id::text, to_jsonb(v_net),
    jsonb_build_object('status', 'Installed in Cage', 'cage', v_cage.cage_code, 'installation_id', v_installation.id));

  return v_installation;
end;
$$;

create or replace function fn_change_net(
  p_old_net_id uuid,
  p_new_net_id uuid,
  p_removal_reason text,
  p_condition_at_removal text default null,
  p_change_date date default current_date,
  p_remarks text default null
) returns net_installations
language plpgsql security definer as $$
declare
  v_old_net nets;
  v_new_net nets;
  v_installation net_installations;
  v_cage_id uuid;
  v_cage cages;
  v_period int;
begin
  perform fn_require_role(array['admin','manager','farm_specialist','diver','storekeeper']::user_role[]);

  select * into v_old_net from nets where id = p_old_net_id for update;
  if v_old_net is null then raise exception 'Current net not found'; end if;

  select * into v_installation from net_installations
    where net_id = p_old_net_id and removal_date is null for update;
  if v_installation is null then
    raise exception 'Net % is not currently installed in a cage', v_old_net.net_code;
  end if;
  v_cage_id := v_installation.cage_id;
  select * into v_cage from cages where id = v_cage_id;

  select * into v_new_net from nets where id = p_new_net_id for update;
  if v_new_net is null then raise exception 'Replacement net not found'; end if;
  if v_new_net.category <> v_old_net.category then
    raise exception 'Replacement net must be the same category as the net being changed';
  end if;
  if v_new_net.id = v_old_net.id then
    raise exception 'Replacement net must be different from the current net';
  end if;
  if v_new_net.status in ('Disposed','Lost','Under Repair','Sent for Cleaning','Under Cleaning','Beyond Repair') then
    raise exception 'Net % cannot be installed while status is "%"', v_new_net.net_code, v_new_net.status;
  end if;
  if exists (select 1 from net_installations where net_id = p_new_net_id and removal_date is null) then
    raise exception 'Net % already has an open installation', v_new_net.net_code;
  end if;

  update net_installations
    set removal_date = p_change_date,
        removal_reason = p_removal_reason,
        condition_at_removal = coalesce(p_condition_at_removal, v_old_net.condition),
        destination = 'Net Store',
        removed_by = auth.uid(),
        remarks = coalesce(p_remarks, remarks)
  where id = v_installation.id;

  update nets set
    status = 'Available in Store',
    condition = coalesce(p_condition_at_removal, condition),
    current_location = 'Net Store',
    current_cage_id = null
  where id = p_old_net_id;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, cage_id, reason, performed_by, remarks)
  values (p_old_net_id, v_cage.cage_code, 'Net Store', v_old_net.status, 'Available in Store', v_cage_id, p_removal_reason, auth.uid(), p_remarks);

  perform fn_write_audit('CHANGE_NET_OUT', 'nets', p_old_net_id::text, to_jsonb(v_old_net),
    jsonb_build_object('status', 'Available in Store', 'reason', p_removal_reason));

  if v_new_net.category = 'MAIN_NET' then
    v_period := fn_get_setting_int('net_change_period_days', 60);
  elsif v_new_net.category = 'GUARD_NET' then
    v_period := fn_get_setting_int('net_change_period_days_guard', 120);
  else
    v_period := null;
  end if;

  insert into net_installations (net_id, cage_id, installation_date, expected_change_date, condition_at_installation, installed_by, remarks)
  values (
    p_new_net_id, v_cage_id, p_change_date,
    case when v_period is null then null else p_change_date + v_period end,
    v_new_net.condition, auth.uid(), p_remarks
  )
  returning * into v_installation;

  update nets set
    status = 'Installed in Cage', current_location = v_cage.cage_code, current_cage_id = v_cage_id
  where id = p_new_net_id;

  if v_new_net.category = 'MAIN_NET' then
    update cages set current_main_net_id = p_new_net_id where id = v_cage_id;
  elsif v_new_net.category = 'GUARD_NET' then
    update cages set current_guard_net_id = p_new_net_id where id = v_cage_id;
  else
    update cages set current_top_net_id = p_new_net_id where id = v_cage_id;
  end if;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, cage_id, reason, performed_by, remarks)
  values (p_new_net_id, 'Net Store', v_cage.cage_code, v_new_net.status, 'Installed in Cage', v_cage_id, 'Net change', auth.uid(), p_remarks);

  perform fn_write_audit('CHANGE_NET_IN', 'nets', p_new_net_id::text, to_jsonb(v_new_net),
    jsonb_build_object('status', 'Installed in Cage', 'cage', v_cage.cage_code, 'replaced', v_old_net.net_code));

  return v_installation;
end;
$$;

-- ---------------------------------------------------------------------
-- v_net_alert_status — exclude installations with no schedule (top nets)
-- ---------------------------------------------------------------------

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
  end as alert_color
from net_installations ni
join nets n on n.id = ni.net_id
join cages c on c.id = ni.cage_id
join sites s on s.id = n.site_id
where ni.removal_date is null and ni.expected_change_date is not null;

-- ---------------------------------------------------------------------
-- v_cage_current_state — add guard net alert columns (top net has none,
-- it's condition-based only)
-- ---------------------------------------------------------------------

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
  guard_alert.alert_color as guard_net_alert_color
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
