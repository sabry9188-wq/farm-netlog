-- =====================================================================
-- NetLog — 0025_drying_under_cage.sql
-- After a change, a heavy fouled net isn't always carried straight to
-- the Net Store: it may be dropped under the cage on the seabed until
-- the biofouling dies off and it's lighter to lift, or laid out to dry.
-- This adds two holding statuses for that, lets Change Net / Remove
-- send the outgoing net to either one, and adds fn_retrieve_net to
-- bring it back later (to the store, to drying, or on to cleaning /
-- repair).
-- =====================================================================

insert into net_statuses (label, color, sort_order) values
  ('Under Cage (Seabed)', 'orange', 13),
  ('Drying', 'yellow', 14)
on conflict (label) do nothing;

-- ---------------------------------------------------------------------
-- fn_install_net — a net that's still under a cage or drying can't be
-- installed until it's been retrieved. (Body otherwise unchanged from
-- 0013.)
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

  if v_net.status in ('Disposed','Lost','Under Repair','Sent for Cleaning','Under Cleaning','Beyond Repair','Under Cage (Seabed)','Drying') then
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

-- ---------------------------------------------------------------------
-- fn_change_net — new p_destination for the outgoing net: 'Net Store'
-- (default, as before), 'Under Cage' or 'Drying'. Adding a parameter
-- changes the signature, so drop the 6-argument version first rather
-- than leaving a second overload behind.
-- ---------------------------------------------------------------------

drop function if exists fn_change_net(uuid, uuid, text, text, date, text);

create function fn_change_net(
  p_old_net_id uuid,
  p_new_net_id uuid,
  p_removal_reason text,
  p_condition_at_removal text default null,
  p_change_date date default current_date,
  p_remarks text default null,
  p_destination text default 'Net Store'
) returns net_installations
language plpgsql security definer as $$
declare
  v_old_net nets;
  v_new_net nets;
  v_installation net_installations;
  v_cage_id uuid;
  v_cage cages;
  v_period int;
  v_out_status text;
  v_out_location text;
begin
  perform fn_require_role(array['admin','manager','farm_specialist','diver','storekeeper']::user_role[]);

  if p_destination not in ('Net Store', 'Under Cage', 'Drying') then
    raise exception 'Unknown destination "%" for the removed net', p_destination;
  end if;

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
  if v_new_net.status in ('Disposed','Lost','Under Repair','Sent for Cleaning','Under Cleaning','Beyond Repair','Under Cage (Seabed)','Drying') then
    raise exception 'Net % cannot be installed while status is "%"', v_new_net.net_code, v_new_net.status;
  end if;
  if exists (select 1 from net_installations where net_id = p_new_net_id and removal_date is null) then
    raise exception 'Net % already has an open installation', v_new_net.net_code;
  end if;

  v_out_status := case p_destination
    when 'Under Cage' then 'Under Cage (Seabed)'
    when 'Drying' then 'Drying'
    else 'Available in Store'
  end;
  v_out_location := case p_destination
    when 'Under Cage' then 'Under ' || v_cage.cage_code
    when 'Drying' then 'Drying Area'
    else 'Net Store'
  end;

  update net_installations
    set removal_date = p_change_date,
        removal_reason = p_removal_reason,
        condition_at_removal = coalesce(p_condition_at_removal, v_old_net.condition),
        destination = p_destination,
        removed_by = auth.uid(),
        remarks = coalesce(p_remarks, remarks)
  where id = v_installation.id;

  update nets set
    status = v_out_status,
    condition = coalesce(p_condition_at_removal, condition),
    current_location = v_out_location,
    current_cage_id = null
  where id = p_old_net_id;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, cage_id, reason, performed_by, remarks)
  values (p_old_net_id, v_cage.cage_code, v_out_location, v_old_net.status, v_out_status, v_cage_id, p_removal_reason, auth.uid(), p_remarks);

  perform fn_write_audit('CHANGE_NET_OUT', 'nets', p_old_net_id::text, to_jsonb(v_old_net),
    jsonb_build_object('status', v_out_status, 'location', v_out_location, 'reason', p_removal_reason));

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
  values (p_new_net_id, v_new_net.current_location, v_cage.cage_code, v_new_net.status, 'Installed in Cage', v_cage_id, 'Net change', auth.uid(), p_remarks);

  perform fn_write_audit('CHANGE_NET_IN', 'nets', p_new_net_id::text, to_jsonb(v_new_net),
    jsonb_build_object('status', 'Installed in Cage', 'cage', v_cage.cage_code, 'replaced', v_old_net.net_code));

  return v_installation;
end;
$$;

-- ---------------------------------------------------------------------
-- fn_remove_net — accept 'Under Cage' and 'Drying' destinations too.
-- (Signature unchanged from 0018, so CREATE OR REPLACE is safe.)
-- ---------------------------------------------------------------------

create or replace function fn_remove_net(
  p_net_id uuid,
  p_removal_date date default current_date,
  p_removal_reason text default null,
  p_condition text default null,
  p_destination text default 'Net Store',
  p_remarks text default null
) returns net_installations
language plpgsql security definer as $$
declare
  v_net nets;
  v_installation net_installations;
  v_cage cages;
  v_new_status text;
  v_new_location text;
begin
  perform fn_require_role(array['admin','manager','farm_specialist','diver','storekeeper']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;

  select * into v_installation from net_installations
    where net_id = p_net_id and removal_date is null for update;
  if v_installation is null then
    raise exception 'Net % is not currently installed in a cage', v_net.net_code;
  end if;

  select * into v_cage from cages where id = v_installation.cage_id;

  update net_installations
    set removal_date = p_removal_date,
        removal_reason = p_removal_reason,
        condition_at_removal = coalesce(p_condition, v_net.condition),
        destination = p_destination,
        removed_by = auth.uid(),
        remarks = coalesce(p_remarks, remarks)
  where id = v_installation.id
  returning * into v_installation;

  v_new_status := case p_destination
    when 'Cleaning' then 'Sent for Cleaning'
    when 'Repair' then 'Under Repair'
    when 'Lost' then 'Lost'
    when 'Under Cage' then 'Under Cage (Seabed)'
    when 'Drying' then 'Drying'
    when 'Disposal' then 'Available in Store'
    else 'Available in Store'
  end;
  v_new_location := case p_destination
    when 'Cleaning' then 'Cleaning'
    when 'Repair' then 'Repair'
    when 'Lost' then coalesce(v_net.current_location, 'Unknown')
    when 'Under Cage' then 'Under ' || v_cage.cage_code
    when 'Drying' then 'Drying Area'
    else 'Net Store'
  end;

  update nets set
    status = v_new_status,
    condition = coalesce(p_condition, condition),
    current_location = v_new_location,
    current_cage_id = null
  where id = p_net_id;

  if v_net.category = 'MAIN_NET' then
    update cages set current_main_net_id = null where id = v_installation.cage_id and current_main_net_id = p_net_id;
  elsif v_net.category = 'GUARD_NET' then
    update cages set current_guard_net_id = null where id = v_installation.cage_id and current_guard_net_id = p_net_id;
  else
    update cages set current_top_net_id = null where id = v_installation.cage_id and current_top_net_id = p_net_id;
  end if;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, cage_id, reason, performed_by, remarks)
  values (p_net_id, v_cage.cage_code, v_new_location, v_net.status, v_new_status, v_installation.cage_id, p_removal_reason, auth.uid(), p_remarks);

  perform fn_write_audit('REMOVE_NET', 'nets', p_net_id::text, to_jsonb(v_net),
    jsonb_build_object('status', v_new_status, 'destination', p_destination, 'installation_id', v_installation.id));

  if p_destination = 'Lost' then
    insert into lost_records (net_id, date_lost, last_known_location, reason, reported_by, remarks)
    values (p_net_id, p_removal_date, v_cage.cage_code, p_removal_reason, auth.uid(), p_remarks);
  elsif p_destination = 'Repair' then
    insert into repair_records (net_id, repair_start, condition_before, remarks)
    values (p_net_id, p_removal_date, coalesce(p_condition, v_net.condition), p_remarks);
  elsif p_destination = 'Cleaning' then
    insert into cleaning_records (net_id, start_date, condition_before, performed_by, remarks)
    values (p_net_id, p_removal_date, coalesce(p_condition, v_net.condition), auth.uid(), p_remarks);
  end if;

  return v_installation;
end;
$$;

-- ---------------------------------------------------------------------
-- fn_retrieve_net — lift a net from under a cage / take it off drying
-- and send it on: 'Net Store', 'Drying' (only from under a cage),
-- 'Cleaning' or 'Repair'.
-- ---------------------------------------------------------------------

create function fn_retrieve_net(
  p_net_id uuid,
  p_retrieve_date date default current_date,
  p_destination text default 'Net Store',
  p_condition text default null,
  p_remarks text default null
) returns nets
language plpgsql security definer as $$
declare
  v_net nets;
  v_new_status text;
  v_new_location text;
begin
  perform fn_require_role(array['admin','manager','farm_specialist','diver','storekeeper']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;
  if v_net.status not in ('Under Cage (Seabed)', 'Drying') then
    raise exception 'Net % is not under a cage or drying (current status: %)', v_net.net_code, v_net.status;
  end if;
  if p_destination not in ('Net Store', 'Drying', 'Cleaning', 'Repair') then
    raise exception 'Unknown destination "%"', p_destination;
  end if;
  if p_destination = 'Drying' and v_net.status = 'Drying' then
    raise exception 'Net % is already drying', v_net.net_code;
  end if;

  v_new_status := case p_destination
    when 'Drying' then 'Drying'
    when 'Cleaning' then 'Sent for Cleaning'
    when 'Repair' then 'Under Repair'
    else 'Available in Store'
  end;
  v_new_location := case p_destination
    when 'Drying' then 'Drying Area'
    when 'Cleaning' then 'Cleaning'
    when 'Repair' then 'Repair'
    else 'Net Store'
  end;

  update nets set
    status = v_new_status,
    condition = coalesce(p_condition, condition),
    current_location = v_new_location,
    current_cage_id = null
  where id = p_net_id;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, v_new_location, v_net.status, v_new_status,
    case v_net.status when 'Drying' then 'Taken off drying' else 'Retrieved from under cage' end,
    auth.uid(), p_remarks);

  if p_destination = 'Repair' then
    insert into repair_records (net_id, repair_start, condition_before, remarks)
    values (p_net_id, p_retrieve_date, coalesce(p_condition, v_net.condition), p_remarks);
  elsif p_destination = 'Cleaning' then
    insert into cleaning_records (net_id, start_date, condition_before, performed_by, remarks)
    values (p_net_id, p_retrieve_date, coalesce(p_condition, v_net.condition), auth.uid(), p_remarks);
  end if;

  perform fn_write_audit('RETRIEVE_NET', 'nets', p_net_id::text, to_jsonb(v_net),
    jsonb_build_object('status', v_new_status, 'location', v_new_location));

  select * into v_net from nets where id = p_net_id;
  return v_net;
end;
$$;
