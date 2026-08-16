"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateNetAction } from "@/lib/actions/nets";
import { CONDITIONS } from "@/lib/constants";
import type { Net } from "@/lib/types/database";

export function EditNetDialog({ net, small }: { net: Net; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mesh, setMesh] = useState(net.mesh_size ?? "");
  const [diameter, setDiameter] = useState(net.diameter_m?.toString() ?? "");
  const [depth, setDepth] = useState(net.depth_m?.toString() ?? "");
  const [material, setMaterial] = useState(net.material ?? "");
  const [manufacturer, setManufacturer] = useState(net.manufacturer ?? "");
  const [supplier, setSupplier] = useState(net.supplier ?? "");
  const [purchaseDate, setPurchaseDate] = useState(net.purchase_date ?? "");
  const [purchaseCost, setPurchaseCost] = useState(net.purchase_cost?.toString() ?? "");
  const [isNew, setIsNew] = useState(net.is_new);
  const [condition, setCondition] = useState(net.condition);
  const [remarks, setRemarks] = useState(net.remarks ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await updateNetAction(net.id, {
        mesh_size: mesh,
        diameter_m: diameter,
        depth_m: depth,
        material,
        manufacturer,
        supplier,
        purchase_date: purchaseDate,
        purchase_cost: purchaseCost,
        is_new: isNew,
        condition,
        remarks,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${net.net_code} updated.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline">
          <Pencil className="size-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit {net.net_code}</DialogTitle>
          <DialogDescription>Category and site are fixed once registered. Everything else can be corrected here.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mesh size">
            <Input value={mesh} onChange={(e) => setMesh(e.target.value)} placeholder="e.g. 10 mm" />
          </Field>
          <Field label="Condition">
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Diameter (m)">
            <Input value={diameter} onChange={(e) => setDiameter(e.target.value)} type="number" step="0.1" />
          </Field>
          <Field label="Depth (m)">
            <Input value={depth} onChange={(e) => setDepth(e.target.value)} type="number" step="0.1" />
          </Field>
          <Field label="Material">
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
          </Field>
          <Field label="Manufacturer">
            <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </Field>
          <Field label="Supplier">
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </Field>
          <Field label="Purchase date">
            <Input value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} type="date" />
          </Field>
          <Field label="Purchase cost">
            <Input value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} type="number" step="0.01" />
          </Field>
          <Field label="New / Used">
            <Select value={isNew ? "new" : "used"} onValueChange={(v) => setIsNew(v === "new")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Remarks">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
