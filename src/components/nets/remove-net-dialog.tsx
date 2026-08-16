"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MinusCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { removeNetAction } from "@/lib/actions/nets";
import { DESTINATION_OPTIONS, REMOVAL_REASONS, CONDITIONS } from "@/lib/constants";

export function RemoveNetDialog({ netId, netCode, cageCode }: { netId: string; netCode: string; cageCode: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("Good");
  const [destination, setDestination] = useState<string>("Net Store");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit() {
    if (!reason) {
      toast.error("Select a removal reason.");
      return;
    }
    startTransition(async () => {
      const res = await removeNetAction({ netId, removalReason: reason, condition, destination, remarks });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} removed from ${cageCode}.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-status-red/40 text-status-red hover:bg-status-red-bg">
          <MinusCircle className="size-4" />
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {netCode} — {cageCode}</DialogTitle>
          <DialogDescription>
            Takes the net out without installing a replacement — for a harvest, disposal, or sending it off for
            cleaning/repair. To swap it for a different net right away, use "Change Net" instead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Removal reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REMOVAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remove-remarks">Remarks (optional)</Label>
            <Textarea id="remove-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending} variant="destructive">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm Removal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
