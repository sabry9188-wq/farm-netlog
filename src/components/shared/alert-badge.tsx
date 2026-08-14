import { AlertTriangle, CheckCircle2, Clock, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDaysRemaining } from "@/lib/calculations";
import type { AlertColor } from "@/lib/types/database";

const CONFIG: Record<AlertColor, { classes: string; icon: typeof Clock }> = {
  green: { classes: "bg-status-green-bg text-status-green border-status-green/30", icon: CheckCircle2 },
  yellow: { classes: "bg-status-yellow-bg text-status-yellow-foreground border-status-yellow/40", icon: Clock },
  orange: { classes: "bg-status-orange-bg text-status-orange border-status-orange/30", icon: AlertTriangle },
  red: { classes: "bg-status-red-bg text-status-red border-status-red/30", icon: OctagonAlert },
};

export function AlertBadge({ daysRemaining, className }: { daysRemaining: number; className?: string }) {
  const color: AlertColor = daysRemaining <= 0 ? "red" : daysRemaining <= 7 ? "orange" : daysRemaining <= 14 ? "yellow" : "green";
  const { classes, icon: Icon } = CONFIG[color];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap", classes, className)}>
      <Icon className="size-3.5" />
      {formatDaysRemaining(daysRemaining)}
    </span>
  );
}
