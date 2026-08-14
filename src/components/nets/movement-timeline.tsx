import {
  Package,
  Anchor,
  Sparkles,
  CheckCircle2,
  Wrench,
  Trash2,
  Ghost,
  Bookmark,
  ArrowRightCircle,
} from "lucide-react";
import { formatDate } from "@/lib/calculations";
import type { NetMovement } from "@/lib/types/database";

const STATUS_ICON: Record<string, typeof Package> = {
  "Available in Store": Package,
  "Installed in Cage": Anchor,
  "Sent for Cleaning": Sparkles,
  "Under Cleaning": Sparkles,
  "Ready for Use": CheckCircle2,
  "Under Repair": Wrench,
  "Ready After Repair": CheckCircle2,
  Reserved: Bookmark,
  Lost: Ghost,
  Damaged: Wrench,
  "Beyond Repair": Wrench,
  Disposed: Trash2,
};

export function MovementTimeline({ movements }: { movements: NetMovement[] }) {
  if (movements.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No movement history yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l-2 border-dashed border-border pl-6">
      {movements.map((m) => {
        const Icon = STATUS_ICON[m.to_status] ?? ArrowRightCircle;
        return (
          <li key={m.id} className="relative pb-6 last:pb-0">
            <span className="absolute top-0.5 -left-[31px] flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
              <Icon className="size-3.5" />
            </span>
            <p className="text-xs font-semibold text-muted-foreground">{formatDate(m.movement_date, { day: "2-digit", month: "short", year: "numeric" })}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {m.to_location}
              {m.from_location && <span className="font-normal text-muted-foreground"> — from {m.from_location}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{m.to_status}</p>
            {m.reason && <p className="mt-0.5 text-xs text-muted-foreground italic">{m.reason}</p>}
          </li>
        );
      })}
    </ol>
  );
}
