import Link from "next/link";
import { cn } from "@/lib/utils";
import { AlertBadge } from "@/components/shared/alert-badge";
import { ALERT_DOT_CLASSES, formatDate } from "@/lib/calculations";
import type { AlertColor, CageStatusColor, VCageCurrentState } from "@/lib/types/database";

const URGENCY: CageStatusColor[] = ["grey", "green", "yellow", "orange", "red"];

// The dot shows whichever of the main / guard net is closer to (or past) its change date.
function worstColor(...colors: (AlertColor | null)[]): CageStatusColor {
  return colors.reduce<CageStatusColor>(
    (worst, c) => (c && URGENCY.indexOf(c) > URGENCY.indexOf(worst) ? c : worst),
    "grey",
  );
}

export function CageCard({ cage, siteSlug }: { cage: VCageCurrentState; siteSlug: string }) {
  const dot = ALERT_DOT_CLASSES[worstColor(cage.main_net_alert_color, cage.guard_net_alert_color)];

  return (
    <Link
      href={`/cages/${siteSlug}/${cage.cage_code}`}
      className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-base font-bold text-foreground">{cage.cage_code}</span>
        <span className={cn("size-2.5 rounded-full ring-2 ring-white", dot)} />
      </div>
      <NetSection
        label="Main"
        mesh={cage.main_net_mesh}
        netCode={cage.main_net_code}
        physicalNumber={cage.main_net_physical_number}
        daysRemaining={cage.main_net_days_remaining}
        dueDate={cage.main_net_expected_change_date}
        emptyText="No main net assigned"
      />
      <NetSection
        label="Guard"
        netCode={cage.guard_net_code}
        physicalNumber={cage.guard_net_physical_number}
        daysRemaining={cage.guard_net_days_remaining}
        dueDate={cage.guard_net_expected_change_date}
        emptyText="No guard net assigned"
        className="border-t border-border pt-2.5"
      />
    </Link>
  );
}

function NetSection({
  label,
  mesh,
  netCode,
  physicalNumber,
  daysRemaining,
  dueDate,
  emptyText,
  className,
}: {
  label: string;
  mesh?: string | null;
  netCode: string | null;
  physicalNumber: string | null;
  daysRemaining: number | null;
  dueDate: string | null;
  emptyText: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
        {mesh && <span className="text-xs font-semibold tracking-normal text-foreground normal-case">{mesh}</span>}
      </div>
      {netCode ? (
        <>
          {/* Physical number is what's marked on the net itself; fall back to the system Net ID if none was recorded. */}
          <p className="truncate font-mono text-[11px] text-muted-foreground" title={netCode}>{physicalNumber || netCode}</p>
          {daysRemaining !== null && <AlertBadge daysRemaining={daysRemaining} className="w-fit text-[10px]" />}
          {dueDate && <p className="text-[11px] text-muted-foreground">Due {formatDate(dueDate)}</p>}
        </>
      ) : (
        <p className="text-xs font-medium text-muted-foreground italic">{emptyText}</p>
      )}
    </div>
  );
}
