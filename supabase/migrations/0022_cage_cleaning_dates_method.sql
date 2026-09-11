-- =====================================================================
-- NetLog — 0022_cage_cleaning_dates_method.sql
-- fn_log_cage_cleaning: splits the single "cleaning date" into a
-- start and end date, since an in-cage cleaning can span more than
-- one day even though the net never leaves the cage.
-- =====================================================================

drop function if exists fn_log_cage_cleaning(uuid, date, text, boolean, text);

create function fn_log_cage_cleaning(
  p_net_id uuid,
  p_start_date date default current_date,
  p_completion_date date default current_date,
  p_method text default null,
  p_adequate boolean default true,
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
  if v_net.status <> 'Installed in Cage' or v_net.current_cage_id is null then
    raise exception 'Net % is not currently installed in a cage', v_net.net_code;
  end if;
  if p_completion_date < p_start_date then
    raise exception 'Cleaning end date cannot be before the start date';
  end if;

  insert into cleaning_records (
    net_id, cage_id, start_date, completion_date, method,
    condition_before, condition_after, adequate, performed_by, remarks
  ) values (
    p_net_id, v_net.current_cage_id, p_start_date, p_completion_date, p_method,
    v_net.condition, v_net.condition, p_adequate, auth.uid(), p_remarks
  ) returning * into v_record;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, v_net.current_location, v_net.status, v_net.status, 'In-cage cleaning', auth.uid(), p_remarks);

  perform fn_write_audit('LOG_CAGE_CLEANING', 'nets', p_net_id::text, to_jsonb(v_net), to_jsonb(v_record));

  return v_record;
end;
$$;
