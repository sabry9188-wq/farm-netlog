"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, BookmarkX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallToCageDialog } from "@/components/nets/install-to-cage-dialog";
import { SendCleaningDialog } from "@/components/nets/send-cleaning-dialog";
import { CompleteCleaningDialog } from "@/components/nets/complete-cleaning-dialog";
import { SendRepairDialog } from "@/components/nets/send-repair-dialog";
import { CompleteRepairDialog } from "@/components/nets/complete-repair-dialog";
import { DisposeNetDialog } from "@/components/nets/dispose-net-dialog";
import { MarkLostDialog } from "@/components/nets/mark-lost-dialog";
import { RemoveNetDialog } from "@/components/nets/remove-net-dialog";
import { setReservedAction } from "@/lib/actions/nets";
import type { Net, UserRole } from "@/lib/types/database";

export function NetActionsBar({ net, role, cageCode }: { net: Net; role: UserRole; cageCode?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (role === "viewer") return null;
  const canApproveDisposal = role === "admin";

  function toggleReserve(next: boolean) {
    startTransition(async () => {
      const res = await setReservedAction({ netId: net.id, reserved: next });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Net reserved." : "Reservation released.");
      router.refresh();
    });
  }

  const buttons: React.ReactNode[] = [];

  if (net.status === "Installed in Cage" && cageCode) {
    buttons.push(<RemoveNetDialog key="remove" netId={net.id} netCode={net.net_code} cageCode={cageCode} />);
  }

  if (["Available in Store", "Ready for Use", "Ready After Repair"].includes(net.status)) {
    buttons.push(<InstallToCageDialog key="install" netId={net.id} netCode={net.net_code} siteId={net.site_id} category={net.category} small />);
    buttons.push(<SendCleaningDialog key="clean" netId={net.id} netCode={net.net_code} small />);
    buttons.push(<SendRepairDialog key="repair" netId={net.id} netCode={net.net_code} small />);
  }

  if (net.status === "Available in Store" || net.status === "Ready for Use") {
    buttons.push(
      <Button key="reserve" size="sm" variant="outline" onClick={() => toggleReserve(true)} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
        Reserve
      </Button>,
    );
  }

  if (net.status === "Reserved") {
    buttons.push(
      <Button key="unreserve" size="sm" variant="outline" onClick={() => toggleReserve(false)} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <BookmarkX className="size-4" />}
        Release Reservation
      </Button>,
    );
  }

  if (net.status === "Sent for Cleaning" || net.status === "Under Cleaning") {
    buttons.push(<CompleteCleaningDialog key="complete-clean" netId={net.id} netCode={net.net_code} small />);
  }

  if (net.status === "Under Repair") {
    buttons.push(<CompleteRepairDialog key="complete-repair" netId={net.id} netCode={net.net_code} small />);
  }

  if (!["Installed in Cage", "Disposed", "Lost"].includes(net.status) && (canApproveDisposal || role === "storekeeper")) {
    buttons.push(<DisposeNetDialog key="dispose" netId={net.id} netCode={net.net_code} small />);
  }

  if (!["Installed in Cage", "Disposed", "Lost"].includes(net.status)) {
    buttons.push(<MarkLostDialog key="lost" netId={net.id} netCode={net.net_code} small />);
  }

  if (buttons.length === 0) return null;

  return <div className="flex flex-wrap gap-2">{buttons}</div>;
}
