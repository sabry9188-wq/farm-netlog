"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
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
import { completeRepairAction } from "@/lib/actions/nets";

const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

export function CompleteRepairDialog({ netId, netCode, small }: { netId: string; netCode: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<"Ready for Use" | "Beyond Repair">("Ready for Use");
  const [condition, setCondition] = useState("Good");
  const [cost, setCost] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await completeRepairAction({
        netId,
        outcome,
        conditionAfter: outcome === "Beyond Repair" ? "Beyond Repair" : condition,
        cost: cost ? Number(cost) : undefined,
        performedBy,
        remarks,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} repair completed.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} className="bg-status-green text-status-green-foreground hover:bg-status-green/90">
          <CheckCircle2 className="size-4" /> Complete Repair
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Complete Repair — {netCode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ready for Use">Ready for Use</SelectItem>
                <SelectItem value="Beyond Repair">Beyond Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {outcome === "Ready for Use" && (
            <div className="space-y-1.5">
              <Label>Condition after repair</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Repair cost (optional)</Label>
            <Input value={cost} onChange={(e) => setCost(e.target.value)} type="number" step="0.01" />
          </div>
          <div className="space-y-1.5">
            <Label>Performed by</Label>
            <Input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Person / company" />
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
