"use client";

import Link from "next/link";
import Image from "next/image";
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
    <div className="relative flex h-full flex-col text-sidebar-foreground">
      <Image src="/sidebar-bg.jpg" alt="" fill sizes="256px" className="object-cover" />
      <div className="absolute inset-0 bg-sidebar/90" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Waves className="size-5" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-white">NetLog</p>
            <p className="text-[11px] font-medium text-white/80">Cage Farm Net Management</p>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold tracking-tight text-white transition-colors",
                  active ? "bg-sidebar-accent shadow-sm" : "hover:bg-sidebar-accent/60",
                )}
              >
                <NavIcon name={item.icon} className="size-4.5 shrink-0 text-white" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="text-[11px] font-semibold text-white/70">Station-05 · 20 cages</p>
          <p className="text-[11px] font-semibold text-white/70">Offshore · 24 cages</p>
        </div>
      </div>
    </div>
  );
}
