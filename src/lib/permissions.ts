// Pure permission helpers — safe to import from Client Components.
// (lib/auth.ts re-exports these alongside the server-only getCurrentProfile,
// for server pages that want both from one import.)
//
// Each user has a list of permission keys (profiles.permissions), set by
// Admin in Settings → Permissions. The database functions check the same
// keys (fn_require_permission, see 0026_user_permissions.sql), so these
// helpers only decide which buttons to show. Admin always has everything.
import type { Profile, UserRole } from "@/lib/types/database";

export const PERMISSIONS = [
  { key: "nets_manage", label: "Register & edit nets", description: "Add new nets and edit net details, including fouling level." },
  { key: "nets_delete", label: "Delete nets", description: "Permanently delete a net." },
  { key: "install", label: "Install / change / remove nets", description: "Cage work, and retrieving nets from Seabed & Drying." },
  { key: "cleaning", label: "Cleaning", description: "Send to cleaning, complete cleaning, log in-cage cleaning." },
  { key: "repair", label: "Repair", description: "Send to repair, complete repair." },
  { key: "lost_found", label: "Reserve / Lost / Found", description: "Reserve a net, mark it lost, mark it found." },
  { key: "cage_info", label: "Edit cage info", description: "Species, fish weight, stocking date and other cage details." },
  { key: "dispose", label: "Dispose nets", description: "Dispose of a net that's no longer usable." },
  { key: "reactivate", label: "Undo disposal", description: "Bring a disposed net back into use." },
  { key: "audit_log", label: "View audit log", description: "See the full history of every change in the Audit Log page." },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];

// The starting set when someone is given a role — matches what each role
// could do before per-user permissions existed.
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: PERMISSIONS.map((p) => p.key),
  storekeeper: ["nets_manage", "nets_delete", "install", "cleaning", "repair", "lost_found", "cage_info"],
  farm_specialist: ["install", "cleaning", "repair", "lost_found", "cage_info"],
  manager: ["install", "cage_info"],
  diver: ["install"],
  viewer: [],
};

export type PermissionSubject = Pick<Profile, "role" | "permissions"> | null | undefined;

export function can(who: PermissionSubject, permission: Permission): boolean {
  if (!who) return false;
  return who.role === "admin" || (who.permissions ?? []).includes(permission);
}

export function isAdmin(who: PermissionSubject): boolean {
  return who?.role === "admin";
}
