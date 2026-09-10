-- =====================================================================
-- NetLog — 0018_fix_remove_net_repair_cleaning.sql
-- fn_remove_net already creates a lost_records row when destination =
-- 'Lost' (see 0012), but never did the equivalent for 'Repair' or
-- 'Cleaning' — so removing a net straight to one of those destinations
-- set its status to "Under Repair" / "Sent for Cleaning" with no open
-- repair_records / cleaning_records row underneath it, leaving nothing
-- for Complete Repair / Complete Cleaning to find and close out. This
-- extends the same pattern used for 'Lost' to those two destinations.
-- =====================================================================

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
