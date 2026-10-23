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
  admin: "Admin",
  manager: "Manager",
  farm_specialist: "Farm Specialist",
  diver: "Diver",
  storekeeper: "Storekeeper",
  viewer: "Viewer",
};

export const DESTINATION_OPTIONS = [
  "Net Store",
  "Under Cage",
  "Drying",
  "Cleaning",
  "Repair",
  "Another Cage",
  "Disposal",
  "Lost",
] as const;

// Where the outgoing net goes on a Change Net — heavy fouled nets are often
// dropped under the cage until the growth dies off, or laid out to dry.
export const CHANGE_DESTINATIONS = [
  { value: "Net Store", label: "Net Store" },
  { value: "Under Cage", label: "Under the cage (seabed)" },
  { value: "Drying", label: "Drying area" },
] as const;

// Temporary holding spots a net waits in before it's retrieved.
export const HOLDING_STATUSES = ["Under Cage (Seabed)", "Drying"] as const;

export const RETRIEVE_DESTINATIONS = ["Net Store", "Drying", "Cleaning", "Repair"] as const;

export const AVAILABLE_STATUSES = ["Available in Store", "Ready for Use", "Ready After Repair"] as const;

export const REMOVAL_REASONS = [
  "Scheduled 60-day change",
  "Harvest",
  "Cleaning",
  "Repair",
  "Damaged",
  "Fish size change",
  "Mesh size change",
  "Cage maintenance",
  "Emergency replacement",
  "Other",
] as const;

export const CONDITIONS = ["New", "Excellent", "Good", "Fair", "Poor", "Damaged", "Requires Repair", "Beyond Repair"] as const;

// Mirrors the fouling_levels lookup table, the same way CONDITIONS mirrors net_conditions.
export const FOULING_LEVELS = ["None", "Light", "Medium", "Heavy", "Very heavy"] as const;

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
  { href: "/holding", label: "Seabed & Drying", icon: "Anchor" },
  { href: "/install", label: "Install / Change Net", icon: "ArrowLeftRight" },
  { href: "/cleaning", label: "Cleaning", icon: "Sparkles" },
  { href: "/repair", label: "Repair", icon: "Wrench" },
  { href: "/lost-found", label: "Lost & Found", icon: "PackageSearch" },
  { href: "/movements", label: "Movement History", icon: "History" },
  { href: "/top-nets", label: "Top Nets", icon: "Bird" },
  { href: "/guard-nets", label: "Guard Nets", icon: "Shield" },
  { href: "/alerts", label: "Alerts", icon: "BellRing" },
  { href: "/reports", label: "Reports", icon: "FileBarChart" },
  { href: "/users", label: "Users", icon: "Users", adminOnly: true },
  { href: "/settings", label: "Settings", icon: "Settings", adminOnly: true },
  { href: "/audit-log", label: "Audit Log", icon: "ShieldCheck", adminOnly: true },
] as const;
