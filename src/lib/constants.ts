import type { NetCategory, UserRole } from "@/lib/types/database";

export const CATEGORY_LABELS: Record<NetCategory, string> = {
  MAIN_NET: "Main Cage Net",
  GUARD_NET: "Guard Net",
  TOP_NET: "Top / Bird Net",
};

export const CATEGORY_SHORT_LABELS: Record<NetCategory, string> = {
  MAIN_NET: "Main Net",
  GUARD_NET: "Guard Net",
  TOP_NET: "Top Net",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin / Manager",
  storekeeper: "Storekeeper",
  supervisor: "Farm Supervisor",
  viewer: "Viewer",
};

export const DESTINATION_OPTIONS = [
  "Net Store",
  "Cleaning",
  "Repair",
  "Another Cage",
  "Disposal",
  "Lost",
] as const;

export const AVAILABLE_STATUSES = ["Available in Store", "Ready for Use", "Ready After Repair"] as const;

export const SITE_SLUGS: Record<string, string> = { ST05: "station-05", OFFS: "offshore" };
export const SITE_CODES_BY_SLUG: Record<string, string> = { "station-05": "ST05", offshore: "OFFS" };

export function siteSlug(siteCode: string): string {
  return SITE_SLUGS[siteCode] ?? siteCode.toLowerCase();
}

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/cages", label: "Cage Farms", icon: "Building2" },
  { href: "/nets", label: "Net Inventory", icon: "Waves" },
  { href: "/store", label: "Net Store", icon: "Package" },
  { href: "/install", label: "Install / Change Net", icon: "ArrowLeftRight" },
  { href: "/cleaning", label: "Cleaning", icon: "Sparkles" },
  { href: "/repair", label: "Repair", icon: "Wrench" },
  { href: "/movements", label: "Movement History", icon: "History" },
  { href: "/top-nets", label: "Top Nets", icon: "Bird" },
  { href: "/guard-nets", label: "Guard Nets", icon: "Shield" },
  { href: "/alerts", label: "Alerts", icon: "BellRing" },
  { href: "/reports", label: "Reports", icon: "FileBarChart" },
  { href: "/users", label: "Users", icon: "Users", adminOnly: true },
  { href: "/settings", label: "Settings", icon: "Settings", adminOnly: true },
  { href: "/audit-log", label: "Audit Log", icon: "ShieldCheck", adminOnly: true },
] as const;
