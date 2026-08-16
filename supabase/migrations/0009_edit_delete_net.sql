-- =====================================================================
-- NetLog — 0009_edit_delete_net.sql
-- Lets Admin/Storekeeper correct a net's descriptive details (mesh,
-- material, manufacturer, supplier, purchase price, etc.) and delete a
-- net outright — but only when it has no real history (no
-- installations, cleaning, repair, disposal, or lost records). A net
-- with any history must go through the Dispose workflow instead, so
-- the audit trail is never silently erased.
-- =====================================================================

create function fn_update_net(p_net_id uuid, p_updates jsonb) returns nets
language plpgsql security definer as $$
declare
  v_before nets;
  v_net nets;
begin
  perform fn_require_role(array['admin','storekeeper']::user_role[]);

  select * into v_before from nets where id = p_net_id for update;
  if v_before is null then raise exception 'Net not found'; end if;

  update nets set
    mesh_size = coalesce(nullif(p_updates->>'mesh_size', ''), mesh_size),
    diameter_m = case when p_updates ? 'diameter_m' then nullif(p_updates->>'diameter_m','')::numeric else diameter_m end,
    depth_m = case when p_updates ? 'depth_m' then nullif(p_updates->>'depth_m','')::numeric else depth_m end,
    length_m = case when p_updates ? 'length_m' then nullif(p_updates->>'length_m','')::numeric else length_m end,
    width_m = case when p_updates ? 'width_m' then nullif(p_updates->>'width_m','')::numeric else width_m end,
    material = coalesce(p_updates->>'material', material),
    manufacturer = coalesce(p_updates->>'manufacturer', manufacturer),
    supplier = coalesce(p_updates->>'supplier', supplier),
    purchase_date = case when p_updates ? 'purchase_date' then nullif(p_updates->>'purchase_date','')::date else purchase_date end,
    purchase_cost = case when p_updates ? 'purchase_cost' then nullif(p_updates->>'purchase_cost','')::numeric else purchase_cost end,
    is_new = coalesce((p_updates->>'is_new')::boolean, is_new),
    condition = coalesce(p_updates->>'condition', condition),
    remarks = coalesce(p_updates->>'remarks', remarks)
  where id = p_net_id
  returning * into v_net;

  perform fn_write_audit('EDIT_NET', 'nets', p_net_id::text, to_jsonb(v_before), to_jsonb(v_net));

  return v_net;
end;
$$;

create function fn_delete_net(p_net_id uuid) returns void
language plpgsql security definer as $$
declare
  v_net nets;
  v_history_count int;
begin
  perform fn_require_role(array['admin','storekeeper']::user_role[]);

  select * into v_net from nets where id = p_net_id for update;
  if v_net is null then raise exception 'Net not found'; end if;

  select
    (select count(*) from net_installations where net_id = p_net_id) +
    (select count(*) from cleaning_records where net_id = p_net_id) +
    (select count(*) from repair_records where net_id = p_net_id) +
    (select count(*) from disposal_records where net_id = p_net_id) +
    (select count(*) from lost_records where net_id = p_net_id)
  into v_history_count;

  if v_history_count > 0 then
    raise exception 'Net % has real history (installations, cleaning, repair, disposal, or lost records) and cannot be deleted — use Dispose instead to keep the audit trail.', v_net.net_code;
  end if;

  perform fn_write_audit('DELETE_NET', 'nets', p_net_id::text, to_jsonb(v_net), null);

  delete from net_movements where net_id = p_net_id;
  delete from nets where id = p_net_id;
end;
$$;
