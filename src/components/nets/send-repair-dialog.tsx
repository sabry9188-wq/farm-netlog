"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";
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
import { sendToRepairAction } from "@/lib/actions/nets";

const REPAIR_TYPES = ["Mesh repair", "Rope repair", "Seam repair", "Panel replacement", "Float line repair", "Sink line repair", "Other"];

export function SendRepairDialog({ netId, netCode, small }: { netId: string; netCode: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [repairType, setRepairType] = useState("Mesh repair");
  const [damage, setDamage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await sendToRepairAction({ netId, repairType, damageDescription: damage });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} sent for repair.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline" className="border-status-orange/40 text-status-orange hover:bg-status-orange-bg">
          <Wrench className="size-4" /> Send to Repair
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send {netCode} to Repair</DialogTitle>
          <DialogDescription>Starts a repair record for this net.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Repair type</Label>
            <Select value={repairType} onValueChange={setRepairType}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPAIR_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Damage description</Label>
            <Textarea value={damage} onChange={(e) => setDamage(e.target.value)} rows={3} placeholder="e.g. Torn panel near float line, ~1.5m" />
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
