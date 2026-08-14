"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateUserRoleAction, setUserStatusAction, setCanApproveDisposalAction } from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types/database";

export function UserRowActions({ user, isSelf }: { user: Profile; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function changeRole(role: UserRole) {
    startTransition(async () => {
      const res = await updateUserRoleAction({ userId: user.id, role });
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function toggleStatus(active: boolean) {
    startTransition(async () => {
      const res = await setUserStatusAction({ userId: user.id, status: active ? "active" : "inactive" });
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function toggleApprove(can: boolean) {
    startTransition(async () => {
      const res = await setCanApproveDisposalAction({ userId: user.id, canApprove: can });
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {user.role === "storekeeper" && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Switch checked={user.can_approve_disposal} onCheckedChange={toggleApprove} disabled={isPending} />
          Can approve disposal
        </label>
      )}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Switch checked={user.status === "active"} onCheckedChange={toggleStatus} disabled={isPending || isSelf} />
        Active
      </label>
      <Select value={user.role} onValueChange={(v) => changeRole(v as UserRole)} disabled={isPending || isSelf}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_LABELS).map(([k, l]) => (
            <SelectItem key={k} value={k}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
