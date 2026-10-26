-- =====================================================================
-- NetLog — 0026_user_permissions.sql
-- Per-user permissions, editable by Admin in Settings → Permissions.
-- Until now each workflow function allowed a fixed list of roles
-- (fn_require_role). Now each one checks a named permission instead,
-- stored per user in profiles.permissions; a role is just the starting
-- set. Admin always has every permission.
--
-- Permission keys:
--   nets_manage  register / edit nets      nets_delete  delete nets
--   install      install / change / remove / retrieve nets
--   cleaning     send / complete / log in-cage cleaning
--   repair       send / complete repair
--   lost_found   reserve, mark lost, mark found
--   cage_info    edit cage production info
--   dispose      dispose nets (replaces profiles.can_approve_disposal)
--   reactivate   undo a disposal
--   audit_log    view the audit log
--
-- The whole file runs in one transaction: if any function isn't in the
-- expected shape, nothing is changed.
-- =====================================================================

begin;

alter table profiles add column if not exists permissions text[] not null default '{}';

-- Everyone keeps exactly what their role allowed before.
update profiles set permissions = case role
  when 'storekeeper' then
    array['nets_manage','nets_delete','install','cleaning','repair','lost_found','cage_info']
    || case when can_approve_disposal then array['dispose'] else array[]::text[] end
  when 'farm_specialist' then array['install','cleaning','repair','lost_found','cage_info']
  when 'manager' then array['install','cage_info']
  when 'diver' then array['install']
  else array[]::text[]
end
where role <> 'admin';

-- ---------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------

create or replace function has_permission(p_permission text) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and status = 'active'
      and (role = 'admin' or p_permission = any(permissions))
  );
$$;

create or replace function fn_require_permission(p_permission text) returns void
language plpgsql security definer as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and status = 'active') then
    raise exception 'Not authenticated or no active profile';
  end if;
  if not has_permission(p_permission) then
    raise exception 'You don''t have permission to %. Ask an Admin to turn it on in Settings → Permissions.',
      case p_permission
        when 'nets_manage' then 'register or edit nets'
        when 'nets_delete' then 'delete nets'
        when 'install' then 'install, change or remove nets'
        when 'cleaning' then 'record cleaning'
        when 'repair' then 'record repairs'
        when 'lost_found' then 'reserve nets or mark them lost / found'
        when 'cage_info' then 'edit cage info'
        when 'dispose' then 'dispose of nets'
        when 'reactivate' then 'undo a disposal'
        when 'audit_log' then 'view the audit log'
        else p_permission
      end;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Switch each workflow function from its role list to a permission.
-- Rewrites the live definition (pg_get_functiondef) so whatever is
-- deployed now — including changes made directly in Supabase — is kept;
-- only the role-check line is swapped.
-- ---------------------------------------------------------------------

do $$
declare
  m record;
  f record;
  v_def text;
  v_new text;
  v_count int;
begin
  for m in
    select * from (values
      ('fn_register_net', 'nets_manage'),
      ('fn_update_net', 'nets_manage'),
      ('fn_delete_net', 'nets_delete'),
      ('fn_install_net', 'install'),
      ('fn_remove_net', 'install'),
      ('fn_change_net', 'install'),
      ('fn_retrieve_net', 'install'),
      ('fn_send_to_cleaning', 'cleaning'),
      ('fn_complete_cleaning', 'cleaning'),
      ('fn_log_cage_cleaning', 'cleaning'),
      ('fn_send_to_repair', 'repair'),
      ('fn_complete_repair', 'repair'),
      ('fn_mark_lost', 'lost_found'),
      ('fn_mark_found', 'lost_found'),
      ('fn_set_reserved', 'lost_found'),
      ('fn_reactivate_net', 'reactivate')
    ) as t(fn, perm)
  loop
    v_count := 0;
    for f in
      select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = m.fn
    loop
      v_def := pg_get_functiondef(f.oid);
      v_new := regexp_replace(
        v_def,
        'perform fn_require_role\(array\[[^]]*\]::user_role\[\]\);',
        format('perform fn_require_permission(%L);', m.perm),
        'i'
      );
      if v_new = v_def then
        raise exception 'Could not find the role check in % — nothing was changed', m.fn;
      end if;
      execute v_new;
      v_count := v_count + 1;
    end loop;
    if v_count = 0 then
      raise exception 'Function % not found — nothing was changed', m.fn;
    end if;
  end loop;

  -- fn_dispose_net had its own Admin-or-approved-Storekeeper check.
  v_count := 0;
  for f in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'fn_dispose_net'
  loop
    v_def := pg_get_functiondef(f.oid);
    v_new := regexp_replace(
      v_def,
      'if not \(v_role = ''admin''.*?end if;',
      'perform fn_require_permission(''dispose'');',
      'i'
    );
    if v_new = v_def then
      raise exception 'Could not find the disposal check in fn_dispose_net — nothing was changed';
    end if;
    execute v_new;
    v_count := v_count + 1;
  end loop;
  if v_count = 0 then
    raise exception 'Function fn_dispose_net not found — nothing was changed';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Direct-table policies that were role-based
-- ---------------------------------------------------------------------

drop policy if exists cages_update on cages;
create policy cages_update on cages for update
  using (has_permission('cage_info'));

drop policy if exists audit_logs_admin_select on audit_logs;
create policy audit_logs_select on audit_logs for select
  using (has_permission('audit_log'));

commit;
