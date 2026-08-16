"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Loader2, Mail, RefreshCw, UserPlus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createUserWithPasswordAction, inviteUserAction } from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/types/database";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("farm_specialist");
  const [password, setPassword] = useState(generatePassword());
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  function reset() {
    setEmail("");
    setFullName("");
    setRole("farm_specialist");
    setPassword(generatePassword());
    setCreated(null);
    setCopied(false);
  }

  function submitWithPassword() {
    if (!email || !fullName || !password) {
      toast.error("Name, email and password are required.");
      return;
    }
    startTransition(async () => {
      const res = await createUserWithPasswordAction({ email, fullName, role, password });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${fullName}'s account is ready.`);
      setCreated({ email, password });
      router.refresh();
    });
  }

  function submitByEmail() {
    if (!email || !fullName) {
      toast.error("Name and email are required.");
      return;
    }
    startTransition(async () => {
      const res = await inviteUserAction({ email, fullName, role });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Invite sent to ${email}.`);
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  function copyCredentials() {
    if (!created) return;
    navigator.clipboard.writeText(`Email: ${created.email}\nPassword: ${created.password}`);
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
        <Button><UserPlus className="size-4" /> Invite User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Account created</DialogTitle>
              <DialogDescription>Share these credentials with them directly — they can change the password after logging in.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Email</p>
                <p className="font-mono font-semibold">{created.email}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Password</p>
                <p className="font-mono font-semibold">{created.password}</p>
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
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Add a teammate and give them a role.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="password">
                <TabsList className="w-full">
                  <TabsTrigger value="password" className="flex-1">Set Password Now</TabsTrigger>
                  <TabsTrigger value="email" className="flex-1">Email Invite</TabsTrigger>
                </TabsList>

                <TabsContent value="password" className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Works instantly — no email needed. Share the password with them yourself.
                  </p>
                  <div className="space-y-1.5">
                    <Label>Temporary password</Label>
                    <div className="flex gap-2">
                      <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
                      <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())} title="Generate new password">
                        <RefreshCw className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={submitWithPassword} disabled={isPending} className="w-full">
                    {isPending && <Loader2 className="size-4 animate-spin" />}
                    Create Account
                  </Button>
                </TabsContent>

                <TabsContent value="email" className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Sends an email so they set their own password. Supabase's free tier limits how many of these can send per hour.
                  </p>
                  <Button onClick={submitByEmail} disabled={isPending} variant="outline" className="w-full">
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    Send Email Invite
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
