"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpFromLine, Loader2 } from "lucide-react";
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
import { retrieveNetAction } from "@/lib/actions/nets";
import { CONDITIONS, RETRIEVE_DESTINATIONS } from "@/lib/constants";
import { FoulingSelect } from "@/components/nets/fouling-select";

export function RetrieveNetDialog({
  netId,
  netCode,
  status,
  currentCondition,
  currentFouling,
  small,
}: {
  netId: string;
  netCode: string;
  status: string;
  currentCondition: string;
  currentFouling: string | null;
  small?: boolean;
}) {
  const isDrying = status === "Drying";
  // A drying net can't be sent to drying again.
  const destinations = RETRIEVE_DESTINATIONS.filter((d) => !(isDrying && d === "Drying"));

  const [open, setOpen] = useState(false);
  const [retrieveDate, setRetrieveDate] = useState(new Date().toISOString().slice(0, 10));
  const [destination, setDestination] = useState<string>("Net Store");
  const [condition, setCondition] = useState(currentCondition);
  const [fouling, setFouling] = useState(currentFouling ?? "");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await retrieveNetAction({
        netId,
        retrieveDate,
        destination,
        condition,
        remarks: remarks || undefined,
        fouling: fouling || undefined,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${netCode} moved to ${destination === "Drying" ? "the drying area" : destination}.`);
      if (res.warning) toast.warning(res.warning);
      setOpen(false);
      setRemarks("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline" className="border-status-green/40 text-status-green hover:bg-status-green-bg">
          <ArrowUpFromLine className="size-4" /> {isDrying ? "Take off drying" : "Retrieve"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isDrying ? `Take ${netCode} off drying` : `Retrieve ${netCode}`}</DialogTitle>
          <DialogDescription>
            {isDrying
              ? "The net is dry — choose where it goes next."
              : "Lift the net from under the cage and choose where it goes next."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={retrieveDate} onChange={(e) => setRetrieveDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Send to</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {destinations.map((d) => (
                  <SelectItem key={d} value={d}>{d === "Drying" ? "Drying area" : d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FoulingSelect label="Fouling level now" value={fouling} onChange={setFouling} />
          <div className="space-y-1.5">
            <Label>Remarks (optional)</Label>
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
