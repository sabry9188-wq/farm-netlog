import Link from "next/link";
import { cn } from "@/lib/utils";
import { AlertBadge } from "@/components/shared/alert-badge";
import { ALERT_DOT_CLASSES } from "@/lib/calculations";
import type { VCageCurrentState } from "@/lib/types/database";

export function CageCard({ cage, siteSlug }: { cage: VCageCurrentState; siteSlug: string }) {
  const dot = ALERT_DOT_CLASSES[cage.cage_status_color];

  return (
    <Link
      href={`/cages/${siteSlug}/${cage.cage_code}`}
      className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-base font-bold text-foreground">{cage.cage_code}</span>
        <span className={cn("size-2.5 rounded-full ring-2 ring-white", dot)} />
      </div>
      {cage.main_net_code ? (
        <>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{cage.main_net_mesh ?? "—"}</span>
          </div>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{cage.main_net_code}</p>
          {cage.main_net_days_remaining !== null && (
            <AlertBadge daysRemaining={cage.main_net_days_remaining} className="mt-0.5 w-fit text-[10px]" />
          )}
        </>
      ) : (
        <p className="text-xs font-medium text-muted-foreground italic">No main net assigned</p>
      )}
    </Link>
  );
}
