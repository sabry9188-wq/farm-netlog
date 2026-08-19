-- =====================================================================
-- NetLog — 0015_mark_found.sql
-- Lets a net marked Lost be recovered — either because it was actually
-- found, or because marking it lost was a mistake. The original
-- lost_records row stays in place (history isn't erased); the recovery
-- itself is written to net_movements and audit_logs.
-- =====================================================================

create function fn_mark_found(
  p_net_id uuid,
  p_condition text default null,
  p_remarks text default null
) returns nets
language plpgsql security definer as $$
declare
  v_net nets;
  v_previous_location text;
begin
  perform fn_require_role(array['admin','storekeeper','farm_specialist']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;
  if v_net.status <> 'Lost' then
    raise exception 'Net % is not marked Lost (current status: %)', v_net.net_code, v_net.status;
  end if;
  v_previous_location := v_net.current_location;

  update nets set
    status = 'Available in Store',
    condition = coalesce(p_condition, condition),
    current_location = 'Net Store',
    current_cage_id = null
  where id = p_net_id
  returning * into v_net;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, v_previous_location, 'Net Store', 'Lost', 'Available in Store', 'Found — returned to store', auth.uid(), p_remarks);

  perform fn_write_audit('MARK_FOUND', 'nets', p_net_id::text, jsonb_build_object('status', 'Lost'), to_jsonb(v_net));

  return v_net;
end;
$$;
