"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, undefined as
    | { error: string }
    | undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state?.error && (
        <p className="rounded-md bg-status-red-bg px-3 py-2 text-sm text-status-red">{state.error}</p>
      )}
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
