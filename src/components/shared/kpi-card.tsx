import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "ocean",
  href,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "ocean" | "aqua" | "green" | "orange" | "red" | "purple" | "grey";
  href?: string;
  hint?: string;
}) {
  const accentClasses: Record<string, string> = {
    ocean: "bg-primary text-primary-foreground",
    aqua: "bg-aqua-500 text-white",
    green: "bg-status-green text-status-green-foreground",
    orange: "bg-status-orange text-status-orange-foreground",
    red: "bg-status-red text-status-red-foreground",
    purple: "bg-status-purple text-status-purple-foreground",
    grey: "bg-status-grey text-status-grey-foreground",
  };

  const barClasses: Record<string, string> = {
    ocean: "bg-primary",
    aqua: "bg-aqua-500",
    green: "bg-status-green",
    orange: "bg-status-orange",
    red: "bg-status-red",
    purple: "bg-status-purple",
    grey: "bg-status-grey",
  };

  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5">
      <span className={cn("absolute inset-x-0 top-0 h-1", barClasses[accent])} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm", accentClasses[accent])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return content;
}
