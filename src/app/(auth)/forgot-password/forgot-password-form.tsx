"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, undefined as
    | { error: string }
    | { data: true }
    | undefined);

  if (state && "data" in state) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground/80">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@farm.com" required autoComplete="email" />
      </div>
      {state?.error && (
        <p className="rounded-md bg-status-red-bg px-3 py-2 text-sm text-status-red">{state.error}</p>
      )}
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>
      <Link href="/login" className="block text-center text-sm font-medium text-primary hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
