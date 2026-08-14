"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";
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
import { fetchEligibleNetsAction, installNetAction } from "@/lib/actions/nets";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Net, NetCategory } from "@/lib/types/database";

export function InstallNetDialog({
  cageId,
  cageCode,
  siteId,
  category,
  triggerLabel,
}: {
  cageId: string;
  cageCode: string;
  siteId: string;
  category: NetCategory;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [nets, setNets] = useState<Net[]>([]);
  const [loadingNets, setLoadingNets] = useState(false);
  const [selectedNetId, setSelectedNetId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setLoadingNets(true);
      const eligible = await fetchEligibleNetsAction({ siteId, category });
      setNets(eligible);
      setLoadingNets(false);
    }
  }

  function onSubmit() {
    if (!selectedNetId) {
      toast.error("Select a net to install.");
      return;
    }
    startTransition(async () => {
      const res = await installNetAction({ netId: selectedNetId, cageId, remarks });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Net installed in ${cageCode}.`);
      setOpen(false);
      setSelectedNetId("");
      setRemarks("");
      router.refresh();
    });
  }

  const selected = nets.find((n) => n.id === selectedNetId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="size-4" />
          {triggerLabel ?? `Install ${CATEGORY_LABELS[category]}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install {CATEGORY_LABELS[category]} — {cageCode}</DialogTitle>
          <DialogDescription>Choose an available net from the store to install in this cage.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Available nets</Label>
            <Select value={selectedNetId} onValueChange={setSelectedNetId}>
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
            <Label htmlFor="install-remarks">Remarks (optional)</Label>
            <Textarea id="install-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !selectedNetId}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm Installation
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
