"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resetUserPermissionsAction, setUserPermissionAction } from "@/lib/actions/users";
import { PERMISSIONS, can, type Permission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

export function PermissionsEditor({ users, initialUserId }: { users: Profile[]; initialUserId?: string }) {
  const [userId, setUserId] = useState(
    users.find((u) => u.id === initialUserId)?.id ?? users.find((u) => u.role !== "admin")?.id ?? users[0]?.id ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const user = users.find((u) => u.id === userId);
  const isAdminUser = user?.role === "admin";

  function toggle(permission: Permission, enabled: boolean) {
    if (!user) return;
    startTransition(async () => {
      const res = await setUserPermissionAction({ userId: user.id, permission, enabled });
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function reset() {
    if (!user) return;
    startTransition(async () => {
      const res = await resetUserPermissionsAction({ userId: user.id });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${user.full_name} reset to the usual ${ROLE_LABELS[user.role]} permissions.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Label>User</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select a user" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name} <span className="text-muted-foreground">· {ROLE_LABELS[u.role]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {user && !isAdminUser && (
          <Button variant="outline" size="sm" onClick={reset} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Reset to {ROLE_LABELS[user.role]} defaults
          </Button>
        )}
      </div>

      {isAdminUser && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Admin always has every permission, and is the only role that can manage Users, Settings and Permissions.
        </p>
      )}

      {user && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {PERMISSIONS.map((p) => (
            <label key={p.key} className="flex items-center justify-between gap-4 px-3 py-2.5">
              <span>
                <span className="block text-sm font-medium">{p.label}</span>
                <span className="block text-xs text-muted-foreground">{p.description}</span>
              </span>
              <Switch
                checked={can(user, p.key)}
                onCheckedChange={(v) => toggle(p.key, v)}
                disabled={isPending || isAdminUser}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
