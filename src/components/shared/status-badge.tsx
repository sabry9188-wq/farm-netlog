import { cn } from "@/lib/utils";
import { STATUS_COLOR_FALLBACK } from "@/lib/calculations";

const COLOR_CLASSES: Record<string, string> = {
  green: "bg-status-green-bg text-status-green border-status-green/30",
  blue: "bg-status-blue-bg text-status-blue border-status-blue/30",
  yellow: "bg-status-yellow-bg text-status-yellow-foreground border-status-yellow/40",
  orange: "bg-status-orange-bg text-status-orange border-status-orange/30",
  red: "bg-status-red-bg text-status-red border-status-red/30",
  purple: "bg-status-purple-bg text-status-purple border-status-purple/30",
  grey: "bg-status-grey-bg text-status-grey border-status-grey/30",
};

const DOT_CLASSES: Record<string, string> = {
  green: "bg-status-green",
  blue: "bg-status-blue",
  yellow: "bg-status-yellow",
  orange: "bg-status-orange",
  red: "bg-status-red",
  purple: "bg-status-purple",
  grey: "bg-status-grey",
};

export function StatusBadge({
  status,
  color,
  className,
}: {
  status: string;
  color?: string;
  className?: string;
}) {
  const key = color ?? STATUS_COLOR_FALLBACK[status] ?? "grey";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        COLOR_CLASSES[key] ?? COLOR_CLASSES.grey,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASSES[key] ?? DOT_CLASSES.grey)} />
      {status}
    </span>
  );
}
