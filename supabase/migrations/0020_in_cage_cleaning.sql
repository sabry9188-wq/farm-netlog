-- =====================================================================
-- NetLog — 0020_in_cage_cleaning.sql
-- Logs cleaning done on a net while it stays installed in its cage,
-- instead of being removed to the Cleaning queue. Records into the
-- same cleaning_records table (so it counts toward a net's lifetime
-- cleaning-cycle stats), tagged with which cage it happened in and
-- whether the cleaning was adequate — and never changes the net's
-- status or location, since it never left the cage.
-- =====================================================================

alter table cleaning_records add column if not exists cage_id uuid references cages (id) on delete set null;
alter table cleaning_records add column if not exists adequate boolean;

create index if not exists idx_cleaning_cage on cleaning_records (cage_id);

create function fn_log_cage_cleaning(
  p_net_id uuid,
  p_cleaning_date date default current_date,
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

  insert into cleaning_records (
    net_id, cage_id, start_date, completion_date, method,
    condition_before, condition_after, adequate, performed_by, remarks
  ) values (
    p_net_id, v_net.current_cage_id, p_cleaning_date, p_cleaning_date, p_method,
    v_net.condition, v_net.condition, p_adequate, auth.uid(), p_remarks
  ) returning * into v_record;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_net.current_location, v_net.current_location, v_net.status, v_net.status, 'In-cage cleaning', auth.uid(), p_remarks);

  perform fn_write_audit('LOG_CAGE_CLEANING', 'nets', p_net_id::text, to_jsonb(v_net), to_jsonb(v_record));

  return v_record;
end;
$$;
