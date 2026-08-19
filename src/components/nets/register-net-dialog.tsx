"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Loader2, PlusCircle } from "lucide-react";
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
import { registerNetAction } from "@/lib/actions/nets";
import { CATEGORY_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Net, NetCategory } from "@/lib/types/database";

const CONDITIONS = ["New", "Excellent", "Good", "Fair", "Poor"];

export type NetTemplate = Net & { site_code?: string };

export function RegisterNetDialog({
  defaultCategory,
  template,
  small,
}: {
  defaultCategory?: NetCategory;
  /** Pre-fills the form from an existing net (mesh, material, manufacturer, supplier,
   * dimensions, cost) — a "Duplicate" shortcut for registering the next net in a batch. */
  template?: NetTemplate;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NetCategory>(template?.category ?? defaultCategory ?? "MAIN_NET");
  const [siteCode, setSiteCode] = useState(template?.site_code ?? "ST05");
  const [netCode, setNetCode] = useState("");
  const [mesh, setMesh] = useState(template?.mesh_size ?? "");
  const [diameter, setDiameter] = useState(template?.diameter_m?.toString() ?? "");
  const [depth, setDepth] = useState(template?.depth_m?.toString() ?? "");
  const [material, setMaterial] = useState(template?.material ?? "");
  const [manufacturer, setManufacturer] = useState(template?.manufacturer ?? "");
  const [supplier, setSupplier] = useState(template?.supplier ?? "");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseCost, setPurchaseCost] = useState(template?.purchase_cost?.toString() ?? "");
  const [isNew, setIsNew] = useState(true);
  const [condition, setCondition] = useState("New");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setNetCode("");
    if (!template) {
      setMesh("");
      setDiameter("");
      setDepth("");
      setMaterial("");
      setManufacturer("");
      setSupplier("");
      setPurchaseCost("");
    }
    setPurchaseDate("");
    setCondition("New");
    setIsNew(true);
    setRemarks("");
  }

  async function onSubmit() {
    startTransition(async () => {
      const supabase = createClient();
      const { data: sites } = await supabase.from("sites").select("id, site_code");
      const site = (sites as { id: string; site_code: string }[] | null)?.find((s) => s.site_code === siteCode);
      if (!site) {
        toast.error("Could not resolve site.");
        return;
      }
      const res = await registerNetAction({
        net_code: netCode || null,
        category,
        site_id: site.id,
        mesh_size: mesh || null,
        diameter_m: diameter || null,
        depth_m: depth || null,
        material: material || null,
        manufacturer: manufacturer || null,
        supplier: supplier || null,
        purchase_date: purchaseDate || null,
        purchase_cost: purchaseCost || null,
        is_new: isNew,
        condition,
        status: "Available in Store",
        current_location: "Net Store",
        remarks: remarks || null,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Net registered.");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {template ? (
          <Button size={small ? "sm" : "default"} variant="outline" title={`Duplicate ${template.net_code} to register a new net`}>
            <Copy className="size-4" />
            {!small && "Duplicate"}
          </Button>
        ) : (
          <Button>
            <PlusCircle className="size-4" /> Register Net
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? `Register New Net — copied from ${template.net_code}` : "Register New Net"}</DialogTitle>
          <DialogDescription>
            {template
              ? "Details are pre-filled from that net. Adjust anything that's different, and a new Net ID will be generated automatically."
              : "Add a physical net to inventory. Leave Net ID blank to auto-generate it."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as NetCategory)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Site">
            <Select value={siteCode} onValueChange={setSiteCode}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ST05">Station-05</SelectItem>
                <SelectItem value="OFFS">Offshore</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Net ID (optional)">
            <Input value={netCode} onChange={(e) => setNetCode(e.target.value)} placeholder="Auto-generated" />
          </Field>
          <Field label="Mesh size">
            <Input value={mesh} onChange={(e) => setMesh(e.target.value)} placeholder="e.g. 10 mm" />
          </Field>
          <Field label="Diameter (m)">
            <Input value={diameter} onChange={(e) => setDiameter(e.target.value)} type="number" step="0.1" />
          </Field>
          <Field label="Depth (m)">
            <Input value={depth} onChange={(e) => setDepth(e.target.value)} type="number" step="0.1" />
          </Field>
          <Field label="Material">
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="HDPE knotless" />
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
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Register Net
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
