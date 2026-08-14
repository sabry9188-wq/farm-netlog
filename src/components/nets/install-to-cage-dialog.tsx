"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Anchor, Loader2 } from "lucide-react";
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
import { installNetAction } from "@/lib/actions/nets";
import { createClient } from "@/lib/supabase/client";
import type { NetCategory } from "@/lib/types/database";

interface CageOption {
  id: string;
  cage_code: string;
}

export function InstallToCageDialog({
  netId,
  netCode,
  siteId,
  category,
  small,
}: {
  netId: string;
  netCode: string;
  siteId: string;
  category: NetCategory;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [cages, setCages] = useState<CageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [cageId, setCageId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const slotColumn =
    category === "MAIN_NET" ? "current_main_net_id" : category === "GUARD_NET" ? "current_guard_net_id" : "current_top_net_id";

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.from("cages").select("id, cage_code").eq("site_id", siteId).is(slotColumn, null).order("cage_code");
      setCages((data as CageOption[]) ?? []);
      setLoading(false);
    }
  }

  function submit() {
    if (!cageId) {
      toast.error("Select a cage.");
      return;
    }
    startTransition(async () => {
      const res = await installNetAction({ netId, cageId, remarks });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} installed.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"}>
          <Anchor className="size-4" /> Install in Cage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Install {netCode}</DialogTitle>
          <DialogDescription>Cages that don't already have this net category assigned.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cage</Label>
            <Select value={cageId} onValueChange={setCageId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={loading ? "Loading…" : "Select a cage"} /></SelectTrigger>
              <SelectContent>
                {cages.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.cage_code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isPending || !cageId}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm Installation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
