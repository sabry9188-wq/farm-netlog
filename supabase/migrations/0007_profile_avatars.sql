-- =====================================================================
-- NetLog — 0007_profile_avatars.sql
-- Adds a profile picture option: an avatar_url column on profiles, a
-- public "avatars" storage bucket, and a narrow self-update function so
-- a user can change their own name/photo without being able to touch
-- their own role (that stays Admin-only via 0004_rls.sql).
-- =====================================================================

alter table profiles add column if not exists avatar_url text;

-- ---------------------------------------------------------------------
-- Storage bucket for avatar images (public read, so <img> tags can
-- load them directly without a signed URL).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone signed in can read avatars (bucket is public anyway, but this
-- also covers listing).
create policy avatars_public_read on storage.objects for select
  using (bucket_id = 'avatars');

-- A user may only upload/replace/delete a file whose path starts with
-- their own user id, e.g. "<uid>/photo.jpg".
create policy avatars_owner_insert on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_owner_update on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_owner_delete on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- fn_update_own_profile — lets a user change their own display name
-- and avatar only. Role/status remain Admin-only (see profiles_admin_update
-- in 0004_rls.sql); this function deliberately does not touch them.
-- ---------------------------------------------------------------------

create function fn_update_own_profile(p_full_name text default null, p_avatar_url text default null)
returns profiles
language plpgsql security definer as $$
declare
  v_profile profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update profiles
    set full_name = coalesce(nullif(p_full_name, ''), full_name),
        avatar_url = coalesce(p_avatar_url, avatar_url)
  where id = auth.uid()
  returning * into v_profile;

  return v_profile;
end;
$$;
