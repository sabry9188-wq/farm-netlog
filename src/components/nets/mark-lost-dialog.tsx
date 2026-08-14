"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ghost, Loader2 } from "lucide-react";
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
import { markLostAction } from "@/lib/actions/nets";

export function MarkLostDialog({ netId, netCode, small }: { netId: string; netCode: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!reason) {
      toast.error("Describe the reason it was lost.");
      return;
    }
    startTransition(async () => {
      const res = await markLostAction({ netId, lastKnownLocation: location, reason, remarks });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} marked as Lost.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline" className="border-status-grey/40 text-status-grey hover:bg-status-grey-bg">
          <Ghost className="size-4" /> Mark Lost
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark {netCode} as Lost</DialogTitle>
          <DialogDescription>The net stays in historical records permanently.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Last known location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. OC09" />
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Storm — net separated from cage" />
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isPending} variant="destructive">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
