import { cn } from "@/lib/utils";
import type { AlertColor } from "@/lib/types/database";

const BAR_CLASSES: Record<AlertColor, string> = {
  green: "bg-status-green",
  yellow: "bg-status-yellow",
  orange: "bg-status-orange",
  red: "bg-status-red",
};

export function NetProgress({
  daysInWater,
  periodDays = 60,
  color,
  className,
}: {
  daysInWater: number;
  periodDays?: number;
  color: AlertColor;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (daysInWater / periodDays) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", BAR_CLASSES[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
        <span>Day {Math.max(0, daysInWater)}</span>
        <span>{periodDays} days</span>
      </div>
    </div>
  );
}
