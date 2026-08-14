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
  accent?: "ocean" | "green" | "orange" | "red" | "purple" | "grey";
  href?: string;
  hint?: string;
}) {
  const accentClasses: Record<string, string> = {
    ocean: "text-primary bg-primary/10",
    green: "text-status-green bg-status-green-bg",
    orange: "text-status-orange bg-status-orange-bg",
    red: "text-status-red bg-status-red-bg",
    purple: "text-status-purple bg-status-purple-bg",
    grey: "text-status-grey bg-status-grey-bg",
  };

  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", accentClasses[accent])}>
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
