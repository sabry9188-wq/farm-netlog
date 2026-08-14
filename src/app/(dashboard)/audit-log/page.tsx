import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/calculations";

export default async function AuditLogPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <div>
      <PageHeader title="Audit Log" description="Every important system action, permanently recorded." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {((logs as any[]) ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(l.created_at, { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                  <TableCell>{l.profiles?.full_name ?? "System"}</TableCell>
                  <TableCell><StatusBadge status={l.action} color="blue" /></TableCell>
                  <TableCell className="text-muted-foreground">{l.entity_type} {l.entity_id ? `#${String(l.entity_id).slice(0, 8)}` : ""}</TableCell>
                  <TableCell className="max-w-md truncate font-mono text-xs text-muted-foreground">
                    {l.new_value ? JSON.stringify(l.new_value) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
