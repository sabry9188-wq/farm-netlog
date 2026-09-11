-- =====================================================================
-- NetLog — 0021_activity_feed.sql
-- A lightweight "everyone sees everyone's activity" notification feed,
-- built as a view over the existing audit_logs table (already written
-- to by every workflow function) rather than a second table to keep
-- in sync. audit_logs itself stays Admin-only (see 0004_rls.sql) —
-- this view intentionally surfaces a friendlier, less detailed read of
-- the same history to every authenticated user, since the whole point
-- of this feed is that all staff can see all data entry as it happens.
-- =====================================================================

alter table profiles add column if not exists last_seen_notifications_at timestamptz not null default now();

-- Narrow self-only update, same pattern as fn_update_own_profile (0007) —
-- lets a user mark the feed as read without opening up profiles_admin_update.
create function fn_mark_notifications_seen() returns void
language plpgsql security definer as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update profiles set last_seen_notifications_at = now() where id = auth.uid();
end;
$$;

create view v_activity_feed as
select
  al.id,
  al.created_at,
  al.user_id,
  p.full_name as actor_name,
  al.action,
  al.entity_type,
  al.entity_id,
  n.net_code,
  c.cage_code,
  al.old_value,
  al.new_value,
  case al.action
    when 'REGISTER_NET' then 'registered a new net'
    when 'EDIT_NET' then 'edited net details'
    when 'DELETE_NET' then 'deleted a net'
    when 'INSTALL_NET' then 'installed a net in a cage'
    when 'REMOVE_NET' then 'removed a net from a cage'
    when 'CHANGE_NET' then 'changed the net installed in a cage'
    when 'SEND_CLEANING' then 'sent a net for cleaning'
    when 'COMPLETE_CLEANING' then 'completed a net cleaning'
    when 'LOG_CAGE_CLEANING' then 'logged in-cage cleaning'
    when 'SEND_REPAIR' then 'sent a net for repair'
    when 'COMPLETE_REPAIR' then 'completed a net repair'
    when 'DISPOSE_NET' then 'disposed of a net'
    when 'MARK_LOST' then 'marked a net as lost'
    when 'MARK_FOUND' then 'marked a net as found'
    when 'REACTIVATE_NET' then 'reactivated a disposed net'
    when 'EDIT_CAGE' then 'edited cage information'
    else initcap(replace(al.action, '_', ' '))
  end as action_label
from audit_logs al
left join profiles p on p.id = al.user_id
left join nets n on al.entity_type = 'nets' and al.entity_id = n.id::text
left join cages c on al.entity_type = 'cages' and al.entity_id = c.id::text
order by al.created_at desc;
