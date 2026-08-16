"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Replace } from "lucide-react";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { fetchEligibleNetsAction, changeNetAction } from "@/lib/actions/nets";
import { REMOVAL_REASONS, CONDITIONS, CATEGORY_LABELS } from "@/lib/constants";
import type { Net, NetCategory } from "@/lib/types/database";

export function ChangeNetDialog({
  oldNetId,
  oldNetCode,
  cageCode,
  siteId,
  category,
  small,
}: {
  oldNetId: string;
  oldNetCode: string;
  cageCode: string;
  siteId: string;
  category: NetCategory;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nets, setNets] = useState<Net[]>([]);
  const [loadingNets, setLoadingNets] = useState(false);
  const [newNetId, setNewNetId] = useState("");
  const [reason, setReason] = useState("Scheduled 60-day change");
  const [condition, setCondition] = useState("Good");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setLoadingNets(true);
      const eligible = await fetchEligibleNetsAction({ siteId, category });
      setNets(eligible.filter((n) => n.id !== oldNetId));
      setLoadingNets(false);
    }
  }

  function submit() {
    if (!newNetId) {
      toast.error("Select a replacement net.");
      return;
    }
    startTransition(async () => {
      const res = await changeNetAction({
        oldNetId,
        newNetId,
        removalReason: reason,
        conditionAtRemoval: condition,
        remarks,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${cageCode} changed to a new net.`);
      setOpen(false);
      setNewNetId("");
      setRemarks("");
      router.refresh();
    });
  }

  const selected = nets.find((n) => n.id === newNetId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline" className="border-status-orange/40 text-status-orange hover:bg-status-orange-bg">
          <Replace className="size-4" />
          Change Net
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change {CATEGORY_LABELS[category]} — {cageCode}</DialogTitle>
          <DialogDescription>
            Takes {oldNetCode} out and installs a replacement in one step. The old net returns to the Net Store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason for change</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REMOVAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Condition of {oldNetCode} on removal</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Replacement net</Label>
            <Select value={newNetId} onValueChange={setNewNetId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingNets ? "Loading…" : "Select a net"} />
              </SelectTrigger>
              <SelectContent>
                {nets.length === 0 && !loadingNets && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">No eligible nets available</div>
                )}
                {nets.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    <span className="font-mono">{n.net_code}</span>
                    {n.mesh_size && <span className="ml-2 text-muted-foreground">{n.mesh_size}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <InfoRow label="Net ID" value={selected.net_code} mono />
              <InfoRow label="Mesh" value={selected.mesh_size ?? "—"} />
              <InfoRow label="Condition" value={selected.condition} />
              <InfoRow label="Status" value={<StatusBadge status={selected.status} className="text-[10px]" />} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="change-remarks">Remarks (optional)</Label>
            <Textarea id="change-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isPending || !newNetId}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono font-semibold" : "font-medium"}>{value}</p>
    </div>
  );
}
