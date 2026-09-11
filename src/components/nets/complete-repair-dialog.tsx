"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, CheckCircle2, Loader2, X } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";

const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

export function CompleteRepairDialog({
  netId,
  netCode,
  meshSize,
  diameterM,
  small,
}: {
  netId: string;
  netCode: string;
  meshSize?: string | null;
  diameterM?: number | null;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [repairEnd, setRepairEnd] = useState(new Date().toISOString().slice(0, 10));
  const [outcome, setOutcome] = useState<"Ready for Use" | "Beyond Repair">("Ready for Use");
  const [condition, setCondition] = useState("Good");
  const [cost, setCost] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [sheetPreview, setSheetPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function onPickSheet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo must be under 8MB.");
      return;
    }
    setSheetFile(file);
    setSheetPreview(URL.createObjectURL(file));
  }

  function clearSheet() {
    setSheetFile(null);
    setSheetPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function submit() {
    startTransition(async () => {
      let repairSheetUrl: string | undefined;

      if (sheetFile) {
        const supabase = createClient();
        const ext = sheetFile.name.split(".").pop() ?? "jpg";
        const path = `${netId}/repair-sheet-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("repair-sheets").upload(path, sheetFile, {
          upsert: true,
          cacheControl: "3600",
        });
        if (uploadError) {
          toast.error(`Repair sheet upload failed: ${uploadError.message}`);
          return;
        }
        const { data } = supabase.storage.from("repair-sheets").getPublicUrl(path);
        repairSheetUrl = data.publicUrl;
      }

      const res = await completeRepairAction({
        netId,
        repairCompletion: repairEnd,
        outcome,
        conditionAfter: outcome === "Beyond Repair" ? "Beyond Repair" : condition,
        cost: cost ? Number(cost) : undefined,
        performedBy,
        remarks,
        repairSheetUrl,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} repair completed.`);
      setOpen(false);
      clearSheet();
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
      <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Repair — {netCode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <InfoRow label="Net Number" value={netCode} mono />
            <InfoRow label="Mesh Size" value={meshSize ?? "—"} />
            <InfoRow label="Diameter" value={diameterM ? `${diameterM} m` : "—"} />
          </div>

          <div className="space-y-1.5">
            <Label>Repair end date</Label>
            <Input type="date" value={repairEnd} onChange={(e) => setRepairEnd(e.target.value)} />
          </div>
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

          <div className="space-y-1.5">
            <Label>Repair sheet photo (optional)</Label>
            <p className="text-xs text-muted-foreground">Attach a photo of the completed physical repair sheet.</p>
            {sheetPreview ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sheetPreview} alt="Repair sheet" className="h-32 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  onClick={clearSheet}
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-status-red text-status-red-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Camera className="size-4" /> Take / attach photo
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPickSheet}
            />
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

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono font-semibold" : "font-medium"}>{value}</p>
    </div>
  );
}
