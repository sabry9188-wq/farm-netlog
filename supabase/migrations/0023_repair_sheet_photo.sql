-- =====================================================================
-- NetLog — 0023_repair_sheet_photo.sql
-- Lets staff attach a photo of the physical repair sheet when closing
-- out a repair — a scanned/photographed copy of the paper form filled
-- in at the workshop, kept alongside the digital record.
-- =====================================================================

alter table repair_records add column if not exists repair_sheet_url text;

insert into storage.buckets (id, name, public)
values ('repair-sheets', 'repair-sheets', true)
on conflict (id) do nothing;

create policy repair_sheets_public_read on storage.objects for select
  using (bucket_id = 'repair-sheets');

create policy repair_sheets_authenticated_insert on storage.objects for insert
  with check (bucket_id = 'repair-sheets' and auth.uid() is not null);

-- Adding a new parameter changes the function's signature, so
-- CREATE OR REPLACE would create a second overload instead of
-- truly replacing the old 7-argument version — drop it explicitly first.
drop function if exists fn_complete_repair(uuid, date, text, numeric, text, text, text);

create function fn_complete_repair(
  p_net_id uuid,
  p_repair_completion date default current_date,
  p_condition_after text default 'Good',
  p_cost numeric default null,
  p_outcome text default 'Ready for Use',
  p_performed_by text default null,
  p_remarks text default null,
  p_repair_sheet_url text default null
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
        remarks = coalesce(p_remarks, remarks),
        repair_sheet_url = coalesce(p_repair_sheet_url, repair_sheet_url)
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
