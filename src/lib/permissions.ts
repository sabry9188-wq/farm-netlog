// Pure role-check helpers — safe to import from Client Components.
// (lib/auth.ts re-exports these alongside the server-only getCurrentProfile,
// for server pages that want both from one import.)
import type { UserRole } from "@/lib/types/database";

/** Install / Change / Remove nets — every role except Viewer. */
export function canInstallChangeNets(role: UserRole | undefined): boolean {
  return role === "admin" || role === "manager" || role === "farm_specialist" || role === "diver" || role === "storekeeper";
}

/** Record cleaning, repair, reservations, and mark-lost — not Manager or Diver. */
export function canCleanRepair(role: UserRole | undefined): boolean {
  return role === "admin" || role === "farm_specialist" || role === "storekeeper";
}

/** Register / edit / delete nets — Admin and Storekeeper only. */
export function canManageNets(role: UserRole | undefined): boolean {
  return role === "admin" || role === "storekeeper";
}

/** Edit cage production info (species, stocking date, etc). */
export function canEditCageInfo(role: UserRole | undefined): boolean {
  return role === "admin" || role === "manager" || role === "farm_specialist";
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === "admin";
}
