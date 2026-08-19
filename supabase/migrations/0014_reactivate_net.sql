-- =====================================================================
-- NetLog — 0014_reactivate_net.sql
-- Lets an Admin undo an accidental disposal. The original
-- disposal_records row is left in place (never erased — it's history,
-- and now shows the net was later reactivated), and the reversal
-- itself is written to net_movements and audit_logs, so nothing about
-- this is silent.
-- =====================================================================

create function fn_reactivate_net(p_net_id uuid, p_remarks text default null) returns nets
language plpgsql security definer as $$
declare
  v_net nets;
begin
  perform fn_require_role(array['admin']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;
  if v_net.status <> 'Disposed' then
    raise exception 'Net % is not disposed (current status: %)', v_net.net_code, v_net.status;
  end if;

  update nets set
    status = 'Available in Store',
    current_location = 'Net Store',
    current_cage_id = null
  where id = p_net_id
  returning * into v_net;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (p_net_id, 'Disposed', 'Net Store', 'Disposed', 'Available in Store', 'Reactivated — disposal correction', auth.uid(), p_remarks);

  perform fn_write_audit('REACTIVATE_NET', 'nets', p_net_id::text, jsonb_build_object('status', 'Disposed'), to_jsonb(v_net));

  return v_net;
end;
$$;
