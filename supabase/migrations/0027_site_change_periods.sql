-- =====================================================================
-- NetLog — 0027_site_change_periods.sql
-- Each site can have its own net change period for main and guard nets
-- (sites.main_change_period_days / guard_change_period_days). When a
-- site's value is null, the farm-wide setting is used as before
-- (net_change_period_days = 60, net_change_period_days_guard = 120).
--
-- Offshore is set to 45 days for both, and the nets already in Offshore
-- cages get their due dates recalculated to installation date + 45.
--
-- Runs in one transaction: if anything isn't in the expected shape,
-- nothing is changed.
-- =====================================================================

begin;

alter table sites add column if not exists main_change_period_days int check (main_change_period_days > 0);
alter table sites add column if not exists guard_change_period_days int check (guard_change_period_days > 0);

-- ---------------------------------------------------------------------
-- fn_install_net / fn_change_net — use the cage's site period first.
-- Patched from the live definitions so the permission checks (0026) and
-- anything else deployed stay as they are.
-- ---------------------------------------------------------------------

do $$
declare
  v_fn text;
  f record;
  v_def text;
  v_new text;
  v_count int;
begin
  foreach v_fn in array array['fn_install_net', 'fn_change_net']
  loop
    v_count := 0;
    for f in
      select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = v_fn
    loop
      v_def := pg_get_functiondef(f.oid);
      v_new := replace(
        v_def,
        'fn_get_setting_int(''net_change_period_days'', 60)',
        'coalesce((select main_change_period_days from sites where id = v_cage.site_id), fn_get_setting_int(''net_change_period_days'', 60))'
      );
      v_new := replace(
        v_new,
        'fn_get_setting_int(''net_change_period_days_guard'', 120)',
        'coalesce((select guard_change_period_days from sites where id = v_cage.site_id), fn_get_setting_int(''net_change_period_days_guard'', 120))'
      );
      if v_new = v_def or position('guard_change_period_days' in v_new) = 0 then
        raise exception 'Could not find the change-period lines in % — nothing was changed', v_fn;
      end if;
      execute v_new;
      v_count := v_count + 1;
    end loop;
    if v_count = 0 then
      raise exception 'Function % not found — nothing was changed', v_fn;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- fn_set_site_change_periods — Admin sets a site's periods from
-- Settings, optionally recalculating nets already installed there.
-- ---------------------------------------------------------------------

create or replace function fn_set_site_change_periods(
  p_site_id uuid,
  p_main_days int,
  p_guard_days int,
  p_recalculate boolean default false
) returns sites
language plpgsql security definer as $$
declare
  v_before sites;
  v_after sites;
begin
  if not is_admin() then
    raise exception 'Only Admin can change net change periods';
  end if;

  select * into v_before from sites where id = p_site_id for update;
  if v_before is null then raise exception 'Site not found'; end if;

  update sites set
    main_change_period_days = p_main_days,
    guard_change_period_days = p_guard_days
  where id = p_site_id
  returning * into v_after;

  if p_recalculate then
    update net_installations ni set expected_change_date = ni.installation_date + coalesce(
        case n.category when 'MAIN_NET' then p_main_days else p_guard_days end,
        case n.category
          when 'MAIN_NET' then fn_get_setting_int('net_change_period_days', 60)
          else fn_get_setting_int('net_change_period_days_guard', 120)
        end)
    from nets n, cages c
    where ni.net_id = n.id and ni.cage_id = c.id
      and c.site_id = p_site_id
      and ni.removal_date is null
      and n.category in ('MAIN_NET', 'GUARD_NET');
  end if;

  perform fn_write_audit('EDIT_SITE_CHANGE_PERIODS', 'sites', p_site_id::text, to_jsonb(v_before),
    to_jsonb(v_after) || jsonb_build_object('recalculated_installed_nets', p_recalculate));

  return v_after;
end;
$$;

-- ---------------------------------------------------------------------
-- Offshore: 45 days for main and guard nets, applied to the nets
-- already in its cages too.
-- ---------------------------------------------------------------------

update sites set main_change_period_days = 45, guard_change_period_days = 45 where site_code = 'OFFS';

update net_installations ni set expected_change_date = ni.installation_date + 45
from nets n, cages c, sites s
where ni.net_id = n.id and ni.cage_id = c.id and c.site_id = s.id
  and s.site_code = 'OFFS'
  and ni.removal_date is null
  and n.category in ('MAIN_NET', 'GUARD_NET');

commit;
