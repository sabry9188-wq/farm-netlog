-- =====================================================================
-- NetLog — 0010_backup_export.sql
-- Powers the "Download Backup" button on the Settings page: bundles
-- every table into one JSON object. Admin only.
-- =====================================================================

create function fn_export_backup() returns jsonb
language plpgsql security definer as $$
declare
  v_role user_role;
begin
  select role into v_role from profiles where id = auth.uid() and status = 'active';
  if v_role is distinct from 'admin' then
    raise exception 'Only Admin can export a backup';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'sites', (select jsonb_agg(t) from sites t),
    'cages', (select jsonb_agg(t) from cages t),
    'nets', (select jsonb_agg(t) from nets t),
    'net_installations', (select jsonb_agg(t) from net_installations t),
    'net_movements', (select jsonb_agg(t) from net_movements t),
    'cleaning_records', (select jsonb_agg(t) from cleaning_records t),
    'repair_records', (select jsonb_agg(t) from repair_records t),
    'disposal_records', (select jsonb_agg(t) from disposal_records t),
    'lost_records', (select jsonb_agg(t) from lost_records t),
    'profiles', (select jsonb_agg(t) from profiles t),
    'mesh_sizes', (select jsonb_agg(t) from mesh_sizes t),
    'net_conditions', (select jsonb_agg(t) from net_conditions t),
    'net_statuses', (select jsonb_agg(t) from net_statuses t),
    'removal_reasons', (select jsonb_agg(t) from removal_reasons t),
    'repair_types', (select jsonb_agg(t) from repair_types t),
    'disposal_reasons', (select jsonb_agg(t) from disposal_reasons t),
    'system_settings', (select jsonb_agg(t) from system_settings t),
    'stock_thresholds', (select jsonb_agg(t) from stock_thresholds t),
    'audit_logs', (select jsonb_agg(t) from audit_logs t)
  );
end;
$$;
