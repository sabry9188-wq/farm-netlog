"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { setUserPasswordAction } from "@/lib/actions/users";
import { generatePassword } from "./invite-user-dialog";
import type { Profile } from "@/lib/types/database";

export function SetPasswordDialog({ user }: { user: Profile }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState(generatePassword());
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function reset() {
    setPassword(generatePassword());
    setSaved(false);
    setCopied(false);
  }

  function submit() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const res = await setUserPasswordAction({ userId: user.id, password });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`New password set for ${user.full_name || user.email}.`);
      setSaved(true);
    });
  }

  function copyCredentials() {
    navigator.clipboard.writeText(`Email: ${user.email}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><KeyRound className="size-4" /> Set password</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {saved ? (
          <>
            <DialogHeader>
              <DialogTitle>Password updated</DialogTitle>
              <DialogDescription>Share these credentials with them directly — their old password no longer works.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Email</p>
                <p className="font-mono font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Password</p>
                <p className="font-mono font-semibold">{password}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={copyCredentials}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Set password</DialogTitle>
              <DialogDescription>
                Give {user.full_name || user.email} a new password. Works instantly — no email needed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label>New password</Label>
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())} title="Generate new password">
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Save password
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
