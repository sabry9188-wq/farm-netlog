import { createClient } from "@/lib/supabase/server";
import { getCleaningQueue, getCleaningHistory } from "@/lib/queries/workflows";
import { getCurrentProfile, canCleanRepair } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CompleteCleaningDialog } from "@/components/nets/complete-cleaning-dialog";
import { formatDate, daysBetween } from "@/lib/calculations";
import Link from "next/link";

export default async function CleaningPage() {
  const supabase = await createClient();
  const [queue, history, profile] = await Promise.all([getCleaningQueue(supabase), getCleaningHistory(supabase), getCurrentProfile()]);
  const writable = canCleanRepair(profile?.role);

  return (
    <div>
      <PageHeader title="Cleaning" description="Nets currently in the cleaning cycle, and completed cleaning history." />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Cleaning Queue ({queue.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Net ID</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Sent for cleaning</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Condition before</TableHead>
                {writable && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nothing in the cleaning queue.</TableCell></TableRow>
              )}
              {queue.map(({ net, record }) => (
                <TableRow key={net.id}>
                  <TableCell className="font-mono font-semibold">
                    <Link href={`/nets/${net.net_code}`} className="text-primary hover:underline">{net.net_code}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{net.sites?.site_code}</TableCell>
                  <TableCell>{record ? formatDate(record.start_date) : "—"}</TableCell>
                  <TableCell>{record?.method ?? "—"}</TableCell>
                  <TableCell>{record?.condition_before ?? net.condition}</TableCell>
                  {writable && (
                    <TableCell className="text-right">
                      <CompleteCleaningDialog netId={net.id} netCode={net.net_code} small />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Cleaning History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Net ID</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Condition Before → After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(history as any[]).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-semibold">
                    <Link href={`/nets/${r.nets?.net_code}`} className="text-primary hover:underline">{r.nets?.net_code}</Link>
                  </TableCell>
                  <TableCell>{formatDate(r.start_date)}</TableCell>
                  <TableCell>{r.completion_date ? formatDate(r.completion_date) : <StatusBadge status="In progress" color="purple" />}</TableCell>
                  <TableCell>{r.completion_date ? `${daysBetween(r.start_date, r.completion_date)} days` : "—"}</TableCell>
                  <TableCell>{r.method ?? "—"}</TableCell>
                  <TableCell>{r.condition_before ?? "—"} → {r.condition_after ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
