-- =====================================================================
-- NetLog — 0011_expanded_roles.sql
-- Expands roles from (admin, storekeeper, supervisor, viewer) to
-- (admin, manager, farm_specialist, diver, storekeeper, viewer).
-- "supervisor" is renamed to "farm_specialist" (same permissions,
-- keeping any existing accounts intact); "manager" and "diver" are new,
-- narrower roles:
--
--   manager          — can install/remove/change nets and edit cage
--                       info day-to-day, but not cleaning/repair/
--                       disposal, and not Users/Settings/Audit Log.
--   farm_specialist  — everything the old "supervisor" could do:
--                       install/remove/change nets, cleaning, repair,
--                       mark lost, reserve, edit cage info.
--   diver            — install/remove/change nets only (the physical
--                       field work) — no cleaning/repair, no cage info
--                       edits.
--   storekeeper      — unchanged.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enum changes
-- ---------------------------------------------------------------------

alter type user_role rename value 'supervisor' to 'farm_specialist';
alter type user_role add value 'manager';
alter type user_role add value 'diver';

-- ---------------------------------------------------------------------
-- Install / Remove / Change — open to manager, farm_specialist, diver,
-- storekeeper, admin
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

  v_period := fn_get_setting_int('net_change_period_days', 60);

  insert into net_installations (
    net_id, cage_id, installation_date, expected_change_date,
    condition_at_installation, installed_by, remarks
  ) values (
    p_net_id, p_cage_id, p_installation_date, p_installation_date + v_period,
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
    when 'Disposal' then 'Available in Store'
    else 'Available in Store'
  end;
  v_new_location := case p_destination
    when 'Cleaning' then 'Cleaning'
    when 'Repair' then 'Repair'
    when 'Lost' then coalesce(v_net.current_location, 'Unknown')
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
  end if;

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

  v_period := fn_get_setting_int('net_change_period_days', 60);

  insert into net_installations (net_id, cage_id, installation_date, expected_change_date, condition_at_installation, installed_by, remarks)
  values (p_new_net_id, v_cage_id, p_change_date, p_change_date + v_period, v_new_net.condition, auth.uid(), p_remarks)
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
-- Cleaning / Repair / Reserve / Mark Lost — admin, farm_specialist,
-- storekeeper only (not manager or diver)
-- ---------------------------------------------------------------------

create or replace function fn_send_to_cleaning(
  p_net_id uuid,
  p_start_date date default current_date,
  p_method text default null,
  p_remarks text default null
) returns cleaning_records
language plpgsql security definer as $$
declare
  v_net nets;
  v_record cleaning_records;
begin
  perform fn_require_role(array['admin','storekeeper','farm_specialist']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;
  if v_net.status not in ('Sent for Cleaning','Available in Store','Ready for Use','Ready After Repair') then
    raise exception 'Net % cannot be sent to cleaning while status is "%"', v_net.net_code, v_net.status;
  end if;

  insert into cleaning_records (net_id, start_date, method, condition_before, performed_by, remarks)
  values (p_net_id, p_start_date, p_method, v_net.condition, auth.uid(), p_remarks)
  returning * into v_record;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, 'Cleaning', v_net.status, 'Under Cleaning', 'Sent for cleaning', auth.uid(), p_remarks);

  update nets set status = 'Under Cleaning', current_location = 'Cleaning' where id = p_net_id;

  perform fn_write_audit('SEND_CLEANING', 'nets', p_net_id::text, to_jsonb(v_net), to_jsonb(v_record));

  return v_record;
end;
$$;

create or replace function fn_complete_cleaning(
  p_net_id uuid,
  p_completion_date date default current_date,
  p_condition_after text default 'Good',
  p_remarks text default null
) returns cleaning_records
language plpgsql security definer as $$
declare
  v_net nets;
  v_record cleaning_records;
begin
  perform fn_require_role(array['admin','storekeeper','farm_specialist']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;

  select * into v_record from cleaning_records
    where net_id = p_net_id and completion_date is null
    order by start_date desc limit 1 for update;
  if v_record is null then raise exception 'Net % has no open cleaning record', v_net.net_code; end if;

  update cleaning_records
    set completion_date = p_completion_date, condition_after = p_condition_after,
        remarks = coalesce(p_remarks, remarks)
  where id = v_record.id
  returning * into v_record;

  update nets set status = 'Ready for Use', condition = p_condition_after, current_location = 'Net Store'
  where id = p_net_id;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, 'Cleaning', 'Net Store', v_net.status, 'Ready for Use', 'Cleaning completed', auth.uid(), p_remarks);

  perform fn_write_audit('COMPLETE_CLEANING', 'nets', p_net_id::text, to_jsonb(v_net), to_jsonb(v_record));

  return v_record;
end;
$$;

create or replace function fn_send_to_repair(
  p_net_id uuid,
  p_repair_start date default current_date,
  p_damage_description text default null,
  p_repair_type text default null,
  p_remarks text default null
) returns repair_records
language plpgsql security definer as $$
declare
  v_net nets;
  v_record repair_records;
begin
  perform fn_require_role(array['admin','storekeeper','farm_specialist']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;
  if v_net.status not in ('Under Repair','Available in Store','Damaged','Ready for Use','Ready After Repair') then
    raise exception 'Net % cannot be sent to repair while status is "%"', v_net.net_code, v_net.status;
  end if;

  insert into repair_records (net_id, damage_description, repair_start, repair_type, condition_before, performed_by, remarks)
  values (p_net_id, p_damage_description, p_repair_start, p_repair_type, v_net.condition, null, p_remarks)
  returning * into v_record;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, 'Repair', v_net.status, 'Under Repair', p_damage_description, auth.uid(), p_remarks);

  update nets set status = 'Under Repair', current_location = 'Repair' where id = p_net_id;

  perform fn_write_audit('SEND_REPAIR', 'nets', p_net_id::text, to_jsonb(v_net), to_jsonb(v_record));

  return v_record;
end;
$$;

create or replace function fn_complete_repair(
  p_net_id uuid,
  p_repair_completion date default current_date,
  p_condition_after text default 'Good',
  p_cost numeric default null,
  p_outcome text default 'Ready for Use',
  p_performed_by text default null,
  p_remarks text default null
) returns repair_records
language plpgsql security definer as $$
declare
  v_net nets;
  v_record repair_records;
  v_new_status text;
begin
  perform fn_require_role(array['admin','storekeeper','farm_specialist']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;

  select * into v_record from repair_records
    where net_id = p_net_id and repair_completion is null
    order by repair_start desc limit 1 for update;
  if v_record is null then raise exception 'Net % has no open repair record', v_net.net_code; end if;

  v_new_status := case when p_outcome = 'Beyond Repair' then 'Beyond Repair' else 'Ready After Repair' end;

  update repair_records
    set repair_completion = p_repair_completion, condition_after = p_condition_after,
        cost = p_cost, outcome = p_outcome, performed_by = coalesce(p_performed_by, performed_by),
        remarks = coalesce(p_remarks, remarks)
  where id = v_record.id
  returning * into v_record;

  update nets set status = v_new_status, condition = p_condition_after, current_location = 'Net Store'
  where id = p_net_id;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, 'Repair', 'Net Store', v_net.status, v_new_status, 'Repair completed', auth.uid(), p_remarks);

  perform fn_write_audit('COMPLETE_REPAIR', 'nets', p_net_id::text, to_jsonb(v_net), to_jsonb(v_record));

  return v_record;
end;
$$;

create or replace function fn_mark_lost(
  p_net_id uuid,
  p_date_lost date default current_date,
  p_last_known_location text default null,
  p_reason text default null,
  p_remarks text default null
) returns lost_records
language plpgsql security definer as $$
declare
  v_net nets;
  v_record lost_records;
begin
  perform fn_require_role(array['admin','storekeeper','farm_specialist']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;
  if v_net.status in ('Lost','Disposed') then
    raise exception 'Net % is already "%"', v_net.net_code, v_net.status;
  end if;

  update net_installations
    set removal_date = p_date_lost, removal_reason = coalesce(p_reason, 'Lost'),
        destination = 'Lost', removed_by = auth.uid()
  where net_id = p_net_id and removal_date is null;

  if v_net.category = 'MAIN_NET' then
    update cages set current_main_net_id = null where current_main_net_id = p_net_id;
  elsif v_net.category = 'GUARD_NET' then
    update cages set current_guard_net_id = null where current_guard_net_id = p_net_id;
  else
    update cages set current_top_net_id = null where current_top_net_id = p_net_id;
  end if;

  insert into lost_records (net_id, date_lost, last_known_location, reason, reported_by, remarks)
  values (p_net_id, p_date_lost, coalesce(p_last_known_location, v_net.current_location), p_reason, auth.uid(), p_remarks)
  returning * into v_record;

  update nets set status = 'Lost', current_location = coalesce(p_last_known_location, current_location), current_cage_id = null
  where id = p_net_id;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, 'Lost', v_net.status, 'Lost', p_reason, auth.uid(), p_remarks);

  perform fn_write_audit('MARK_LOST', 'nets', p_net_id::text, to_jsonb(v_net), to_jsonb(v_record));

  return v_record;
end;
$$;

create or replace function fn_set_reserved(p_net_id uuid, p_reserved boolean, p_remarks text default null) returns nets
language plpgsql security definer as $$
declare
  v_net nets;
  v_new_status text;
begin
  perform fn_require_role(array['admin','storekeeper','farm_specialist']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;

  if p_reserved then
    if v_net.status not in ('Available in Store','Ready for Use','Ready After Repair') then
      raise exception 'Only in-store nets can be reserved (current status: %)', v_net.status;
    end if;
    v_new_status := 'Reserved';
  else
    if v_net.status <> 'Reserved' then
      raise exception 'Net % is not reserved', v_net.net_code;
    end if;
    v_new_status := 'Available in Store';
  end if;

  update nets set status = v_new_status where id = p_net_id returning * into v_net;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, v_net.current_location,
    case when p_reserved then 'Available in Store' else 'Reserved' end, v_new_status,
    case when p_reserved then 'Reserved' else 'Reservation released' end, auth.uid(), p_remarks);

  perform fn_write_audit('SET_RESERVED', 'nets', p_net_id::text, null, jsonb_build_object('status', v_new_status));

  return v_net;
end;
$$;

-- ---------------------------------------------------------------------
-- Cage info edits (species, stocking date, etc.) — admin, manager,
-- farm_specialist (not diver, not storekeeper)
-- ---------------------------------------------------------------------

drop policy if exists cages_update on cages;
create policy cages_update on cages for update
  using (has_any_role(array['admin','manager','farm_specialist']::user_role[]));
