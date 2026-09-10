-- =====================================================================
-- NetLog — 0016_physical_net_number.sql
-- Adds an optional "physical number" field: the serial/ID actually
-- printed or tagged on the physical net, kept separate from net_code
-- (the system-generated ID) since the two don't always match.
-- =====================================================================

alter table nets add column if not exists physical_number text;

create or replace function fn_register_net(p_net jsonb) returns nets
language plpgsql security definer as $$
declare
  v_net nets;
begin
  perform fn_require_role(array['admin','storekeeper']::user_role[]);

  insert into nets (
    net_code, physical_number, category, site_id, mesh_size, diameter_m, depth_m, length_m, width_m,
    material, manufacturer, supplier, purchase_date, purchase_cost, is_new,
    condition, status, current_location, remarks, created_by
  ) values (
    nullif(p_net->>'net_code', ''),
    p_net->>'physical_number',
    (p_net->>'category')::net_category,
    (p_net->>'site_id')::uuid,
    p_net->>'mesh_size',
    nullif(p_net->>'diameter_m','')::numeric,
    nullif(p_net->>'depth_m','')::numeric,
    nullif(p_net->>'length_m','')::numeric,
    nullif(p_net->>'width_m','')::numeric,
    p_net->>'material',
    p_net->>'manufacturer',
    p_net->>'supplier',
    nullif(p_net->>'purchase_date','')::date,
    nullif(p_net->>'purchase_cost','')::numeric,
    coalesce((p_net->>'is_new')::boolean, true),
    coalesce(p_net->>'condition', 'New'),
    coalesce(p_net->>'status', 'Available in Store'),
    coalesce(p_net->>'current_location', 'Net Store'),
    p_net->>'remarks',
    auth.uid()
  ) returning * into v_net;

  insert into net_movements (net_id, from_location, to_location, from_status, to_status, reason, performed_by, remarks)
  values (v_net.id, null, v_net.current_location, null, v_net.status, 'Net registered', auth.uid(), 'Initial registration');

  perform fn_write_audit('REGISTER_NET', 'nets', v_net.id::text, null, to_jsonb(v_net));

  return v_net;
end;
$$;

create or replace function fn_update_net(p_net_id uuid, p_updates jsonb) returns nets
language plpgsql security definer as $$
declare
  v_before nets;
  v_net nets;
begin
  perform fn_require_role(array['admin','storekeeper']::user_role[]);

  select * into v_before from nets where id = p_net_id for update;
  if v_before is null then raise exception 'Net not found'; end if;

  update nets set
    physical_number = coalesce(p_updates->>'physical_number', physical_number),
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
