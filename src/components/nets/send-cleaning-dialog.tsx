"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { sendToCleaningAction } from "@/lib/actions/nets";

export function SendCleaningDialog({ netId, netCode, small }: { netId: string; netCode: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await sendToCleaningAction({ netId, method, remarks });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} sent for cleaning.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline" className="border-status-purple/40 text-status-purple hover:bg-status-purple-bg">
          <Sparkles className="size-4" /> Send to Cleaning
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send {netCode} to Cleaning</DialogTitle>
          <DialogDescription>Starts a cleaning record for this net.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cleaning method</Label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. Pressure wash" />
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
