"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { addLookupItemAction, toggleLookupItemAction } from "@/lib/actions/settings";
import type { LookupRow } from "@/lib/types/database";

const TABLES = ["mesh_sizes", "net_conditions", "net_statuses", "removal_reasons", "repair_types", "disposal_reasons"] as const;
type LookupTable = (typeof TABLES)[number];

export function LookupEditor({ table, items }: { table: LookupTable; items: LookupRow[] }) {
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function add() {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      const res = await addLookupItemAction(table, newLabel.trim());
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setNewLabel("");
      router.refresh();
    });
  }

  function toggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await toggleLookupItemAction(table, id, active);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
          <span className={item.is_active ? "font-medium" : "text-muted-foreground line-through"}>{item.label}</span>
          <Switch checked={item.is_active} onCheckedChange={(v) => toggle(item.id, v)} disabled={isPending} />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Add new…" onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button size="sm" onClick={add} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
