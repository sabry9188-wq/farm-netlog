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
        <div className="space-y-2 rounded-2xl bg-sidebar-accent/40 px-4 py-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
            <span>Station-05</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-white">20 cages</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
            <span>Offshore</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-white">24 cages</span>
          </div>
        </div>
      </div>
    </div>
  );
}
