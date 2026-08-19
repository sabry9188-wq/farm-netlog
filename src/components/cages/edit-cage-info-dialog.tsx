"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
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
import { updateCageInfoAction } from "@/lib/actions/cages";

export function EditCageInfoDialog({
  cageId,
  cageCode,
  species,
  avgFishWeightG,
  stockingDate,
  productionStage,
}: {
  cageId: string;
  cageCode: string;
  species: string | null;
  avgFishWeightG: number | null;
  stockingDate: string | null;
  productionStage: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [speciesVal, setSpeciesVal] = useState(species ?? "");
  const [weightVal, setWeightVal] = useState(avgFishWeightG?.toString() ?? "");
  const [stockingDateVal, setStockingDateVal] = useState(stockingDate ?? "");
  const [stageVal, setStageVal] = useState(productionStage ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function submit() {
    startTransition(async () => {
      const res = await updateCageInfoAction({
        cageId,
        species: speciesVal.trim() || null,
        avgFishWeightG: weightVal ? Number(weightVal) : null,
        stockingDate: stockingDateVal || null,
        productionStage: stageVal.trim() || null,
        path: pathname,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${cageCode} updated.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil className="size-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Cage Information — {cageCode}</DialogTitle>
          <DialogDescription>Update the production details for this cage.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cage-species">Species</Label>
            <Input id="cage-species" value={speciesVal} onChange={(e) => setSpeciesVal(e.target.value)} placeholder="e.g. Seabass" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cage-weight">Avg. fish weight (g)</Label>
            <Input id="cage-weight" type="number" step="1" min="0" value={weightVal} onChange={(e) => setWeightVal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cage-stocking-date">Stocking date</Label>
            <Input id="cage-stocking-date" type="date" value={stockingDateVal} onChange={(e) => setStockingDateVal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cage-stage">Production stage</Label>
            <Input id="cage-stage" value={stageVal} onChange={(e) => setStageVal(e.target.value)} placeholder="e.g. Grow-out" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
