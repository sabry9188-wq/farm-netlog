"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { NavIcon } from "@/components/layout/nav-icon";
import { Waves } from "lucide-react";
import type { UserRole } from "@/lib/types/database";
import type { SiteStat } from "@/lib/queries/sites";

const SITE_ACCENTS = ["aqua", "yellow"] as const;
const SITE_ACCENT_CLASSES: Record<(typeof SITE_ACCENTS)[number], { dot: string; chip: string }> = {
  aqua: { dot: "bg-aqua-400", chip: "bg-aqua-400/20 text-aqua-400" },
  yellow: { dot: "bg-status-yellow", chip: "bg-status-yellow/25 text-status-yellow" },
};

export function SidebarNav({
  role,
  siteStats,
  onNavigate,
}: {
  role: UserRole;
  siteStats: SiteStat[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !("adminOnly" in item && item.adminOnly) || role === "admin");

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md">
          <Waves className="size-5" />
        </div>
        <div>
          <p className="text-base font-extrabold tracking-tight text-white">NetLog</p>
          <p className="text-[11px] font-medium text-white/70">Cage Farm Net Management</p>
        </div>
      </div>

      <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl py-2 pr-4 pl-2 text-sm font-semibold tracking-tight transition-colors",
                active ? "bg-white text-ocean-950 shadow-md" : "text-white/85 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-white/70",
                )}
              >
                <NavIcon name={item.icon} className="size-4.5" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4">
        <div className="space-y-3 rounded-2xl bg-white px-4 py-3.5 shadow-md">
          {siteStats.map((s, i) => {
            const accent = SITE_ACCENT_CLASSES[SITE_ACCENTS[i % SITE_ACCENTS.length]];
            return (
              <div key={s.site.id}>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-ocean-950/70">
                  <span className={cn("size-1.5 rounded-full", accent.dot)} />
                  {s.site.site_name}
                </p>
                <div className="flex gap-1.5">
                  <span className={cn("flex-1 rounded-lg px-2 py-1 text-center text-[10px] font-bold", accent.chip)}>
                    {s.cageCount} cages
                  </span>
                  <span className={cn("flex-1 rounded-lg px-2 py-1 text-center text-[10px] font-bold", accent.chip)}>
                    {s.netCount} nets
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
