"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, BellRing, LogOut, User, UserCog } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { EditProfileDialog } from "@/components/layout/edit-profile-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types/database";
import type { SiteStat } from "@/lib/queries/sites";

export function Topbar({
  profile,
  role,
  alertCount,
  siteStats,
}: {
  profile: Profile | null;
  role: UserRole;
  alertCount: number;
  siteStats: SiteStat[];
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (q) router.push(`/search?q=${encodeURIComponent(String(q))}`);
  }

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-backdrop-filter:bg-card/80 sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav role={role} siteStats={siteStats} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </Button>

      <form onSubmit={handleSearch} className="hidden flex-1 max-w-md sm:block">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder="Search Net ID, Cage ID, mesh size…" className="pl-9" suppressHydrationWarning />
        </div>
      </form>

      <div className="flex flex-1 justify-end items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative" asChild>
          <a href="/alerts">
            <BellRing className="size-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-status-red text-[9px] font-bold text-status-red-foreground">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </a>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="size-8 rounded-full object-cover ring-1 ring-border" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </span>
              )}
              <span className="hidden text-left leading-tight md:block">
                <span className="block text-sm font-semibold">{profile?.full_name ?? "User"}</span>
                <span className="block text-[11px] text-muted-foreground">{ROLE_LABELS[role]}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                <User className="size-3.5" /> {profile?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <UserCog className="size-4" /> Edit profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left text-status-red">
                  <LogOut className="size-4" /> Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {profile && <EditProfileDialog profile={profile} open={editOpen} onOpenChange={setEditOpen} />}
    </header>
  );
}
