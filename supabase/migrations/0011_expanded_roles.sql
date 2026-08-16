-- =====================================================================
-- NetLog — 0011_expanded_roles.sql
-- Part 1 of the role expansion: (admin, storekeeper, supervisor,
-- viewer) becomes (admin, manager, farm_specialist, diver,
-- storekeeper, viewer). Run this FIRST, and run
-- 0012_expanded_roles_functions.sql SEPARATELY straight after —
-- Postgres won't allow a brand-new enum value to be used in the same
-- transaction that created it, so this has to be two steps.
--
-- "supervisor" is renamed to "farm_specialist" (same permissions,
-- keeping any existing accounts intact); "manager" and "diver" are new,
-- narrower roles:
--
--   manager          — can install/remove/change nets and edit cage
--                       info day-to-day, but not cleaning/repair/
--                       disposal, and not Users/Settings/Audit Log.
--   farm_specialist  — everything the old "supervisor" could do:
--                       install/remove/change nets, cleaning, repair,
--                       mark lost, reserve, edit cage info.
--   diver            — install/remove/change nets only (the physical
--                       field work) — no cleaning/repair, no cage info
--                       edits.
--   storekeeper      — unchanged.
-- =====================================================================

alter type user_role rename value 'supervisor' to 'farm_specialist';
alter type user_role add value 'manager';
alter type user_role add value 'diver';
