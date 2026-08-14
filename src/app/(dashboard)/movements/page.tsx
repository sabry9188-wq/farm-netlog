import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/calculations";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("net_movements")
    .select("*, nets(net_code, category)")
    .order("movement_date", { ascending: false })
    .limit(300);

  const { data: movements } = await query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (movements as any[]) ?? [];
  if (q) {
    rows = rows.filter((r) => r.nets?.net_code?.toLowerCase().includes(q.toLowerCase()));
  }

  return (
    <div>
      <PageHeader title="Movement History" description="Complete, append-only ledger of every net movement across the farm." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Net ID</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status Change</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No movements recorded yet.</TableCell></TableRow>
              )}
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(m.movement_date)}</TableCell>
                  <TableCell className="font-mono font-semibold">
                    <Link href={`/nets/${m.nets?.net_code}`} className="text-primary hover:underline">{m.nets?.net_code}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.from_location ?? "—"}</TableCell>
                  <TableCell className="font-medium">{m.to_location}</TableCell>
                  <TableCell><StatusBadge status={m.to_status} /></TableCell>
                  <TableCell className="max-w-72 truncate text-muted-foreground">{m.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
