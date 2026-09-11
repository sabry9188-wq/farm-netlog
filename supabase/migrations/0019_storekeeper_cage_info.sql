-- =====================================================================
-- NetLog — 0019_storekeeper_cage_info.sql
-- Extends cage-info edit access (species, stocking date, etc.) to
-- Storekeeper, matching the app-level canEditCageInfo() change.
-- =====================================================================

drop policy if exists cages_update on cages;
create policy cages_update on cages for update
  using (has_any_role(array['admin','manager','farm_specialist','storekeeper']::user_role[]));
