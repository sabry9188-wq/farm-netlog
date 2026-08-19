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
  const cardClasses: Record<string, string> = {
    ocean: "bg-primary text-primary-foreground",
    aqua: "bg-aqua-500 text-ocean-950",
    green: "bg-status-green text-status-green-foreground",
    orange: "bg-status-orange text-status-orange-foreground",
    red: "bg-status-red text-status-red-foreground",
    purple: "bg-status-purple text-status-purple-foreground",
    grey: "bg-status-grey text-status-grey-foreground",
  };

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5",
        cardClasses[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-80">{label}</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs opacity-80">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
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
