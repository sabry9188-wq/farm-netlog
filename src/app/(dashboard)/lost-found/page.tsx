import Link from "next/link";
import { Ghost, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLostNets, getDisposedNets } from "@/lib/queries/nets";
import { getCurrentProfile, canCleanRepair, isAdmin as checkIsAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_SHORT_LABELS } from "@/lib/constants";
import { MarkFoundDialog } from "@/components/nets/mark-found-dialog";
import { ReactivateNetDialog } from "@/components/nets/reactivate-net-dialog";
import { formatDate } from "@/lib/calculations";

export default async function LostFoundPage() {
  const supabase = await createClient();
  const [lost, disposed, profile] = await Promise.all([getLostNets(supabase), getDisposedNets(supabase), getCurrentProfile()]);

  const canFind = canCleanRepair(profile?.role);
  const canReactivate = checkIsAdmin(profile?.role);

  return (
    <div>
      <PageHeader
        title="Lost & Found"
        description="Every net currently marked Lost or Disposed, in one place — with one-click recovery if it turns up or was a mistake."
      />

      <Tabs defaultValue="lost">
        <TabsList>
          <TabsTrigger value="lost">
            <Ghost className="size-4" /> Lost ({lost.length})
          </TabsTrigger>
          <TabsTrigger value="disposed">
            <Trash2 className="size-4" /> Disposed ({disposed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lost">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lost Nets</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Net ID</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date Lost</TableHead>
                    <TableHead>Last Known Location</TableHead>
                    <TableHead>Reason</TableHead>
                    {canFind && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lost.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No nets currently marked Lost.
                      </TableCell>
                    </TableRow>
                  )}
                  {lost.map(({ net, record }) => (
                    <TableRow key={net.id}>
                      <TableCell className="font-mono font-semibold">
                        <Link href={`/nets/${net.net_code}`} className="text-primary hover:underline">
                          {net.net_code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{net.sites?.site_code}</TableCell>
                      <TableCell>{CATEGORY_SHORT_LABELS[net.category]}</TableCell>
                      <TableCell>{record ? formatDate(record.date_lost) : "—"}</TableCell>
                      <TableCell>{record?.last_known_location ?? "—"}</TableCell>
                      <TableCell className="max-w-64 truncate">{record?.reason ?? "—"}</TableCell>
                      {canFind && (
                        <TableCell className="text-right">
                          <MarkFoundDialog netId={net.id} netCode={net.net_code} currentCondition={net.condition} small />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disposed">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disposed Nets</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Net ID</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Disposal Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reason</TableHead>
                    {canReactivate && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disposed.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No nets currently marked Disposed.
                      </TableCell>
                    </TableRow>
                  )}
                  {disposed.map(({ net, record }) => (
                    <TableRow key={net.id}>
                      <TableCell className="font-mono font-semibold">
                        <Link href={`/nets/${net.net_code}`} className="text-primary hover:underline">
                          {net.net_code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{net.sites?.site_code}</TableCell>
                      <TableCell>{CATEGORY_SHORT_LABELS[net.category]}</TableCell>
                      <TableCell>{record ? formatDate(record.disposal_date) : "—"}</TableCell>
                      <TableCell>{record?.method ?? "—"}</TableCell>
                      <TableCell className="max-w-64 truncate">{record?.reason ?? "—"}</TableCell>
                      {canReactivate && (
                        <TableCell className="text-right">
                          <ReactivateNetDialog netId={net.id} netCode={net.net_code} small />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
