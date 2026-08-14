"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSystemSettingAction } from "@/lib/actions/settings";
import type { SystemSetting } from "@/lib/types/database";

export function SystemSettingsForm({ settings }: { settings: SystemSetting[] }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(settings.map((s) => [s.key, s.value])));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    startTransition(async () => {
      for (const s of settings) {
        if (values[s.key] !== s.value) {
          const res = await updateSystemSettingAction(s.key, values[s.key]);
          if (res.error) {
            toast.error(res.error);
            return;
          }
        }
      }
      toast.success("Settings saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {settings.map((s) => (
        <div key={s.key} className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-center">
          <Label className="sm:col-span-2">
            <span className="block font-medium">{s.key.replace(/_/g, " ")}</span>
            <span className="block text-xs font-normal text-muted-foreground">{s.description}</span>
          </Label>
          <Input
            type="number"
            value={values[s.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
          />
        </div>
      ))}
      <Button onClick={save} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save Settings
      </Button>
    </div>
  );
}
