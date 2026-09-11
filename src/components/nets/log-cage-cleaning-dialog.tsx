"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Droplets, Loader2 } from "lucide-react";
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
import { logCageCleaningAction } from "@/lib/actions/nets";

const CLEANING_METHODS = ["Net Cleaning Machine", "Brushing"];
const OTHER_METHOD = "__other__";

export function LogCageCleaningDialog({ netId, netCode, small }: { netId: string; netCode: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [methodSelect, setMethodSelect] = useState("");
  const [methodOther, setMethodOther] = useState("");
  const [adequate, setAdequate] = useState("yes");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (endDate < startDate) {
      toast.error("Cleaning end date can't be before the start date.");
      return;
    }
    const method = methodSelect === OTHER_METHOD ? methodOther : methodSelect;
    startTransition(async () => {
      const res = await logCageCleaningAction({
        netId,
        startDate,
        completionDate: endDate,
        method: method || undefined,
        adequate: adequate === "yes",
        remarks: remarks || undefined,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Cleaning logged for ${netCode}.`);
      setOpen(false);
      setMethodSelect("");
      setMethodOther("");
      setRemarks("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? "sm" : "default"} variant="outline">
          <Droplets className="size-4" /> Log Cleaning
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Cleaning — {netCode}</DialogTitle>
          <DialogDescription>For cleaning done while the net stays installed in the cage. It won't leave "Installed in Cage".</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cleaning start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cleaning end date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cleaning method</Label>
            <Select value={methodSelect} onValueChange={setMethodSelect}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a method" /></SelectTrigger>
              <SelectContent>
                {CLEANING_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
                <SelectItem value={OTHER_METHOD}>Other…</SelectItem>
              </SelectContent>
            </Select>
            {methodSelect === OTHER_METHOD && (
              <Input
                autoFocus
                value={methodOther}
                onChange={(e) => setMethodOther(e.target.value)}
                placeholder="Enter cleaning method"
                className="mt-1.5"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Cleaning adequate?</Label>
            <Select value={adequate} onValueChange={setAdequate}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
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
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
