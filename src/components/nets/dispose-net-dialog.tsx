"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { disposeNetAction } from "@/lib/actions/nets";

const REASONS = ["Beyond repair", "Severe damage", "Excessive wear", "Lost", "Expired/unusable", "Other"];

export function DisposeNetDialog({ netId, netCode, small }: { netId: string; netCode: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Beyond repair");
  const [method, setMethod] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await disposeNetAction({ netId, reason, method, performedBy: approvedBy, remarks });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} disposed and removed from active stock.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="destructive">
          <Trash2 className="size-4" /> Dispose
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Dispose {netCode}</DialogTitle>
          <DialogDescription>
            This permanently marks the net Disposed. It stays visible in historical reports but is removed from
            available stock. Requires Admin (or an authorized Storekeeper).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Disposal method</Label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. Cut up and scrapped" />
          </div>
          <div className="space-y-1.5">
            <Label>Performed by</Label>
            <Input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} />
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
            Confirm Disposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
