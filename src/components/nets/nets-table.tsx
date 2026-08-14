import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CATEGORY_SHORT_LABELS } from "@/lib/constants";
import type { NetWithSite } from "@/lib/queries/nets";

export function NetsTable({ nets, showCategory = true }: { nets: NetWithSite[]; showCategory?: boolean }) {
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
