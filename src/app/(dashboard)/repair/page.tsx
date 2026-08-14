import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRepairQueue, getRepairHistory } from "@/lib/queries/workflows";
import { getCurrentProfile, canWrite } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CompleteRepairDialog } from "@/components/nets/complete-repair-dialog";
import { formatDate, daysBetween } from "@/lib/calculations";

export default async function RepairPage() {
  const supabase = await createClient();
  const [queue, history, profile] = await Promise.all([getRepairQueue(supabase), getRepairHistory(supabase), getCurrentProfile()]);
  const writable = canWrite(profile?.role);

  return (
    <div>
      <PageHeader title="Repair" description="Nets currently under repair, and completed repair history." />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Repair Queue ({queue.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Net ID</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Sent for repair</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Damage</TableHead>
                {writable && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nothing in the repair queue.</TableCell></TableRow>
              )}
              {queue.map(({ net, record }) => (
                <TableRow key={net.id}>
                  <TableCell className="font-mono font-semibold">
                    <Link href={`/nets/${net.net_code}`} className="text-primary hover:underline">{net.net_code}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{net.sites?.site_code}</TableCell>
                  <TableCell>{record ? formatDate(record.repair_start) : "—"}</TableCell>
                  <TableCell>{record?.repair_type ?? "—"}</TableCell>
                  <TableCell className="max-w-64 truncate">{record?.damage_description ?? "—"}</TableCell>
                  {writable && (
                    <TableCell className="text-right">
                      <CompleteRepairDialog netId={net.id} netCode={net.net_code} small />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Repair History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Net ID</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(history as any[]).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-semibold">
                    <Link href={`/nets/${r.nets?.net_code}`} className="text-primary hover:underline">{r.nets?.net_code}</Link>
                  </TableCell>
                  <TableCell>{formatDate(r.repair_start)}</TableCell>
                  <TableCell>{r.repair_completion ? formatDate(r.repair_completion) : <StatusBadge status="In progress" color="orange" />}</TableCell>
                  <TableCell>{r.repair_completion ? `${daysBetween(r.repair_start, r.repair_completion)} days` : "—"}</TableCell>
                  <TableCell>{r.repair_type ?? "—"}</TableCell>
                  <TableCell>{r.outcome ?? "—"}</TableCell>
                  <TableCell>{r.cost ? `$${Number(r.cost).toLocaleString()}` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
