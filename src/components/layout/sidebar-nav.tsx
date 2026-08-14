"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { NavIcon } from "@/components/layout/nav-icon";
import { Waves } from "lucide-react";
import type { UserRole } from "@/lib/types/database";

export function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !("adminOnly" in item && item.adminOnly) || role === "admin");

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Waves className="size-5" />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-white">NetLog</p>
          <p className="text-[11px] text-sidebar-foreground/60">Cage Farm Net Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <NavIcon name={item.icon} className={cn("size-4.5 shrink-0", active && "text-sidebar-primary")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] text-sidebar-foreground/50">Station-05 · 20 cages</p>
        <p className="text-[11px] text-sidebar-foreground/50">Offshore · 24 cages</p>
      </div>
    </div>
  );
}
