import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EditNetDialog } from "@/components/nets/edit-net-dialog";
import { DeleteNetDialog } from "@/components/nets/delete-net-dialog";
import { RegisterNetDialog } from "@/components/nets/register-net-dialog";
import { ReactivateNetDialog } from "@/components/nets/reactivate-net-dialog";
import { MarkFoundDialog } from "@/components/nets/mark-found-dialog";
import { CATEGORY_SHORT_LABELS } from "@/lib/constants";
import type { NetWithSite } from "@/lib/queries/nets";

export function NetsTable({
  nets,
  showCategory = true,
  canManage = false,
  isAdmin = false,
  canMarkFound = false,
}: {
  nets: NetWithSite[];
  showCategory?: boolean;
  canManage?: boolean;
  isAdmin?: boolean;
  canMarkFound?: boolean;
}) {
  if (nets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        No nets match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Net ID</TableHead>
            <TableHead>Site</TableHead>
            {showCategory && <TableHead>Category</TableHead>}
            <TableHead>Mesh</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            {(canManage || isAdmin || canMarkFound) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {nets.map((n) => (
            <TableRow key={n.id}>
              <TableCell className="font-mono font-semibold">
                <Link href={`/nets/${n.net_code}`} className="text-primary hover:underline">
                  {n.net_code}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{n.sites?.site_code}</TableCell>
              {showCategory && <TableCell>{CATEGORY_SHORT_LABELS[n.category]}</TableCell>}
              <TableCell>{n.mesh_size ?? "—"}</TableCell>
              <TableCell>{n.condition}</TableCell>
              <TableCell>
                <StatusBadge status={n.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{n.current_location}</TableCell>
              {(canManage || isAdmin || canMarkFound) && (
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    {isAdmin && n.status === "Disposed" && <ReactivateNetDialog netId={n.id} netCode={n.net_code} small />}
                    {canMarkFound && n.status === "Lost" && (
                      <MarkFoundDialog netId={n.id} netCode={n.net_code} currentCondition={n.condition} small />
                    )}
                    {canManage && (
                      <>
                        <RegisterNetDialog template={{ ...n, site_code: n.sites?.site_code }} small />
                        <EditNetDialog net={n} small />
                        <DeleteNetDialog netId={n.id} netCode={n.net_code} small />
                      </>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
