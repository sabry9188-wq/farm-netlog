"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { markNotificationsSeenAction } from "@/lib/actions/notifications";

interface ActivityRow {
  id: string;
  created_at: string;
  actor_name: string | null;
  action_label: string;
  net_code: string | null;
  cage_code: string | null;
}

const POLL_MS = 45_000;
const FEED_LIMIT = 30;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell({ initialLastSeenAt }: { initialLastSeenAt: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState(initialLastSeenAt);
  const [open, setOpen] = useState(false);

  const fetchFeed = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("v_activity_feed")
      .select("id, created_at, actor_name, action_label, net_code, cage_code")
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT);
    if (data) setRows(data as ActivityRow[]);
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  const unreadCount = rows.filter((r) => new Date(r.created_at) > new Date(lastSeenAt)).length;

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      setLastSeenAt(new Date().toISOString());
      await markNotificationsSeenAction();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-status-blue text-[9px] font-bold text-status-blue-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-3 py-2.5 text-sm font-semibold">Activity</DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto">
          {rows.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          )}
          {rows.map((r) => (
            <div key={r.id} className="border-b border-border/60 px-3 py-2.5 text-sm last:border-0">
              <p className="text-foreground">
                <span className="font-semibold">{r.actor_name ?? "Someone"}</span> {r.action_label}
                {r.net_code && (
                  <>
                    {" — "}
                    <Link href={`/nets/${r.net_code}`} className="font-mono font-semibold text-primary hover:underline">
                      {r.net_code}
                    </Link>
                  </>
                )}
                {!r.net_code && r.cage_code && (
                  <>
                    {" — "}
                    <span className="font-mono font-semibold">{r.cage_code}</span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(r.created_at)}</p>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
