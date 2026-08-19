"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SearchCheck } from "lucide-react";
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
import { markFoundAction } from "@/lib/actions/nets";
import { CONDITIONS } from "@/lib/constants";

export function MarkFoundDialog({ netId, netCode, currentCondition, small }: { netId: string; netCode: string; currentCondition: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState(currentCondition);
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await markFoundAction(netId, condition, remarks || "Found after being marked lost");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} marked Found — back in the Net Store.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline" className="border-status-green/40 text-status-green hover:bg-status-green-bg">
          <SearchCheck className="size-4" /> {!small && "Found"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark {netCode} as Found</DialogTitle>
          <DialogDescription>
            For a net that turned up after a search, or was marked Lost by mistake. It returns to "Available in
            Store" — the original Lost record stays in its history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Condition found in</Label>
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
            <Label>Notes (optional)</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="e.g. Found tangled on OC09 mooring line" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Mark as Found
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
