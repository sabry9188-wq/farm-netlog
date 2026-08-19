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

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-tight text-white/85 transition-colors",
                active ? "bg-sidebar-accent text-white shadow-sm" : "hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <NavIcon name={item.icon} className={cn("size-4.5 shrink-0", active ? "text-sidebar-primary" : "text-white/70")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] font-semibold text-white/60">Station-05 · 20 cages</p>
        <p className="text-[11px] font-semibold text-white/60">Offshore · 24 cages</p>
      </div>
    </div>
  );
}
