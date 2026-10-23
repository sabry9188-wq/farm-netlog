import Link from "next/link";
import { ArrowDownToLine, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHoldingNets, type HoldingNetRow } from "@/lib/queries/nets";
import { getCurrentProfile, canInstallChangeNets } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_SHORT_LABELS } from "@/lib/constants";
import { RetrieveNetDialog } from "@/components/nets/retrieve-net-dialog";
import { daysBetween, formatDate } from "@/lib/calculations";

export default async function HoldingPage() {
  const supabase = await createClient();
  const [rows, profile] = await Promise.all([getHoldingNets(supabase), getCurrentProfile()]);

  const canRetrieve = canInstallChangeNets(profile?.role);
  const underCage = rows.filter((r) => r.net.status === "Under Cage (Seabed)");
  const drying = rows.filter((r) => r.net.status === "Drying");

  return (
    <div>
      <PageHeader
        title="Seabed & Drying"
        description="Nets taken out of a cage but not yet back in the Net Store — dropped under the cage until the fouling dies off, or laid out to dry."
      />

      <Tabs defaultValue="under-cage">
        <TabsList>
          <TabsTrigger value="under-cage">
            <ArrowDownToLine className="size-4" /> Under Cage ({underCage.length})
          </TabsTrigger>
          <TabsTrigger value="drying">
            <Sun className="size-4" /> Drying ({drying.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="under-cage">
          <HoldingTable
            title="Under the Cage (Seabed)"
            sinceLabel="Dropped On"
            emptyText="No nets are under a cage right now."
            rows={underCage}
            canRetrieve={canRetrieve}
          />
        </TabsContent>

        <TabsContent value="drying">
          <HoldingTable
            title="Drying Area"
            sinceLabel="Drying Since"
            emptyText="No nets are drying right now."
            rows={drying}
            canRetrieve={canRetrieve}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HoldingTable({
  title,
  sinceLabel,
  emptyText,
  rows,
  canRetrieve,
}: {
  title: string;
  sinceLabel: string;
  emptyText: string;
  rows: HoldingNetRow[];
  canRetrieve: boolean;
}) {
  const today = new Date();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Net ID</TableHead>
              <TableHead>Physical #</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>{sinceLabel}</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Fouling</TableHead>
              {canRetrieve && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={canRetrieve ? 10 : 9} className="py-10 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ net, since }) => (
              <TableRow key={net.id}>
                <TableCell className="font-mono font-semibold">
                  <Link href={`/nets/${net.net_code}`} className="text-primary hover:underline">
                    {net.net_code}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{net.physical_number ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{net.sites?.site_code}</TableCell>
                <TableCell>{CATEGORY_SHORT_LABELS[net.category]}</TableCell>
                <TableCell>{net.current_location}</TableCell>
                <TableCell>{formatDate(since)}</TableCell>
                <TableCell className="font-semibold">{since ? daysBetween(since, today) : "—"}</TableCell>
                <TableCell>{net.condition}</TableCell>
                <TableCell>{net.fouling_level ?? "—"}</TableCell>
                {canRetrieve && (
                  <TableCell className="text-right">
                    <RetrieveNetDialog
                      netId={net.id}
                      netCode={net.net_code}
                      status={net.status}
                      currentCondition={net.condition}
                      currentFouling={net.fouling_level}
                      small
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
