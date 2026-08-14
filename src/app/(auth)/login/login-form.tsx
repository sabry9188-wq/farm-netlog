"use client";

import { useActionState } from "react";
import { signInAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, undefined as
    | { error: string }
    | undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@farm.com" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state?.error && (
        <p className="rounded-md bg-status-red-bg px-3 py-2 text-sm text-status-red">{state.error}</p>
      )}
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
