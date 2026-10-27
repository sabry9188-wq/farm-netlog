"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setSiteChangePeriodsAction } from "@/lib/actions/settings";
import type { Site } from "@/lib/types/database";

// Blank = use the farm-wide default from the settings above.
function toDays(value: string): number | null | "invalid" {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : "invalid";
}

export function SiteChangePeriodsForm({
  sites,
  defaultMainDays,
  defaultGuardDays,
}: {
  sites: Site[];
  defaultMainDays: number;
  defaultGuardDays: number;
}) {
  return (
    <div className="space-y-4">
      {sites.map((site) => (
        <SiteRow key={site.id} site={site} defaultMainDays={defaultMainDays} defaultGuardDays={defaultGuardDays} />
      ))}
    </div>
  );
}

function SiteRow({ site, defaultMainDays, defaultGuardDays }: { site: Site; defaultMainDays: number; defaultGuardDays: number }) {
  const [main, setMain] = useState(site.main_change_period_days?.toString() ?? "");
  const [guard, setGuard] = useState(site.guard_change_period_days?.toString() ?? "");
  const [recalculate, setRecalculate] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    const mainDays = toDays(main);
    const guardDays = toDays(guard);
    if (mainDays === "invalid" || guardDays === "invalid") {
      toast.error("Days must be a whole number above 0, or blank to use the default.");
      return;
    }
    startTransition(async () => {
      const res = await setSiteChangePeriodsAction({ siteId: site.id, mainDays, guardDays, recalculate });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${site.site_name} saved${recalculate ? " — due dates of nets already in its cages were updated" : ""}.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <p className="text-sm font-semibold">{site.site_name}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Main net change period (days)</Label>
          <Input type="number" min={1} value={main} onChange={(e) => setMain(e.target.value)} placeholder={`Default: ${defaultMainDays}`} />
        </div>
        <div className="space-y-1.5">
          <Label>Guard net change period (days)</Label>
          <Input type="number" min={1} value={guard} onChange={(e) => setGuard(e.target.value)} placeholder={`Default: ${defaultGuardDays}`} />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={recalculate} onCheckedChange={setRecalculate} />
          Also update due dates of nets already in this site&apos;s cages
        </label>
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
      </div>
    </div>
  );
}
