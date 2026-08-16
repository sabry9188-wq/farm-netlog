import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Fish, Ruler, Calendar, Waves } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCageDetail, getCageRow, getCageInstallationHistory } from "@/lib/queries/cages";
import { getCurrentProfile, canWrite } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertBadge } from "@/components/shared/alert-badge";
import { NetProgress } from "@/components/shared/net-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InstallNetDialog } from "@/components/nets/install-net-dialog";
import { ChangeNetDialog } from "@/components/nets/change-net-dialog";
import { RemoveNetDialog } from "@/components/nets/remove-net-dialog";
import { formatDate, daysBetween } from "@/lib/calculations";
import { SITE_CODES_BY_SLUG } from "@/lib/constants";

export default async function CageDetailPage({
  params,
}: {
  params: Promise<{ site: string; cageCode: string }>;
}) {
  const { site: siteSlugParam, cageCode } = await params;
  if (!SITE_CODES_BY_SLUG[siteSlugParam]) notFound();

  const supabase = await createClient();
  const [cage, cageRow, profile] = await Promise.all([
    getCageDetail(supabase, cageCode),
    getCageRow(supabase, cageCode),
    getCurrentProfile(),
  ]);
  if (!cage || !cageRow) notFound();

  const history = await getCageInstallationHistory(supabase, cageRow.id);
  const mainHistory = history.filter((h) => h.nets.category === "MAIN_NET");
  const guardHistory = history.filter((h) => h.nets.category === "GUARD_NET");
  const topHistory = history.filter((h) => h.nets.category === "TOP_NET");
  const writable = canWrite(profile?.role);

  return (
    <div>
      <Link href={`/cages/${siteSlugParam}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to {cage.site_name}
      </Link>
      <PageHeader title={`${cage.cage_code} — ${cage.site_name}`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Cage Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow icon={Ruler} label="Diameter × Depth" value={`${cageRow.diameter_m}m × ${cageRow.depth_m}m`} />
            <InfoRow icon={Fish} label="Species" value={cage.species ?? "Not set"} />
            <InfoRow icon={Waves} label="Avg. fish weight" value={cage.avg_fish_weight_g ? `${cage.avg_fish_weight_g} g` : "Not set"} />
            <InfoRow icon={Calendar} label="Stocking date" value={formatDate(cage.stocking_date)} />
            <InfoRow icon={Waves} label="Production stage" value={cage.production_stage ?? "Not set"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Current Main Net</CardTitle>
            {writable &&
              (cage.main_net_id ? (
                <div className="flex gap-2">
                  <ChangeNetDialog
                    oldNetId={cage.main_net_id}
                    oldNetCode={cage.main_net_code!}
                    cageCode={cage.cage_code}
                    siteId={cage.site_id}
                    category="MAIN_NET"
                    small
                  />
                  <RemoveNetDialog netId={cage.main_net_id} netCode={cage.main_net_code!} cageCode={cage.cage_code} />
                </div>
              ) : (
                <InstallNetDialog cageId={cageRow.id} cageCode={cage.cage_code} siteId={cage.site_id} category="MAIN_NET" />
              ))}
          </CardHeader>
          <CardContent>
            {cage.main_net_id ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/nets/${cage.main_net_code}`} className="font-mono text-lg font-bold text-primary hover:underline">
                    {cage.main_net_code}
                  </Link>
                  <StatusBadge status="Installed in Cage" color="blue" />
                  {cage.main_net_days_remaining !== null && <AlertBadge daysRemaining={cage.main_net_days_remaining} />}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
                  <InfoRow label="Mesh" value={cage.main_net_mesh ?? "—"} />
                  <InfoRow label="Condition" value={cage.main_net_condition ?? "—"} />
                  <InfoRow label="Installed" value={formatDate(cage.main_net_installation_date)} />
                  <InfoRow label="Next change" value={formatDate(cage.main_net_expected_change_date)} />
                </div>
                {cage.main_net_installation_date && (
                  <NetProgress
                    daysInWater={daysBetween(cage.main_net_installation_date, new Date())}
                    color={cage.main_net_alert_color ?? "green"}
                  />
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No main net currently installed in this cage.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Current Guard Net</CardTitle>
            {writable &&
              (cage.guard_net_id ? (
                <div className="flex gap-2">
                  <ChangeNetDialog
                    oldNetId={cage.guard_net_id}
                    oldNetCode={cage.guard_net_code!}
                    cageCode={cage.cage_code}
                    siteId={cage.site_id}
                    category="GUARD_NET"
                    small
                  />
                  <RemoveNetDialog netId={cage.guard_net_id} netCode={cage.guard_net_code!} cageCode={cage.cage_code} />
                </div>
              ) : (
                <InstallNetDialog cageId={cageRow.id} cageCode={cage.cage_code} siteId={cage.site_id} category="GUARD_NET" triggerLabel="Install" />
              ))}
          </CardHeader>
          <CardContent>
            {cage.guard_net_id ? (
              <div className="space-y-2">
                <Link href={`/nets/${cage.guard_net_code}`} className="font-mono text-base font-bold text-primary hover:underline">
                  {cage.guard_net_code}
                </Link>
                <InfoRow label="Condition" value={cage.guard_net_condition ?? "—"} />
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No guard net assigned.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Current Top / Bird Net</CardTitle>
            {writable &&
              (cage.top_net_id ? (
                <div className="flex gap-2">
                  <ChangeNetDialog
                    oldNetId={cage.top_net_id}
                    oldNetCode={cage.top_net_code!}
                    cageCode={cage.cage_code}
                    siteId={cage.site_id}
                    category="TOP_NET"
                    small
                  />
                  <RemoveNetDialog netId={cage.top_net_id} netCode={cage.top_net_code!} cageCode={cage.cage_code} />
                </div>
              ) : (
                <InstallNetDialog cageId={cageRow.id} cageCode={cage.cage_code} siteId={cage.site_id} category="TOP_NET" triggerLabel="Install" />
              ))}
          </CardHeader>
          <CardContent>
            {cage.top_net_id ? (
              <div className="space-y-2">
                <Link href={`/nets/${cage.top_net_code}`} className="font-mono text-base font-bold text-primary hover:underline">
                  {cage.top_net_code}
                </Link>
                <InfoRow label="Condition" value={cage.top_net_condition ?? "—"} />
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No top/bird net assigned.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Net History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="main">
            <TabsList>
              <TabsTrigger value="main">Main Net ({mainHistory.length})</TabsTrigger>
              <TabsTrigger value="guard">Guard Net ({guardHistory.length})</TabsTrigger>
              <TabsTrigger value="top">Top Net ({topHistory.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="main">
              <HistoryTable rows={mainHistory} />
            </TabsContent>
            <TabsContent value="guard">
              <HistoryTable rows={guardHistory} />
            </TabsContent>
            <TabsContent value="top">
              <HistoryTable rows={topHistory} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function HistoryTable({
  rows,
}: {
  rows: { nets: { net_code: string; mesh_size: string | null }; installation_date: string; removal_date: string | null; removal_reason: string | null }[];
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No history yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Net ID</TableHead>
          <TableHead>Mesh</TableHead>
          <TableHead>Installed</TableHead>
          <TableHead>Removed</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell className="font-mono font-medium">
              <Link href={`/nets/${r.nets.net_code}`} className="text-primary hover:underline">
                {r.nets.net_code}
              </Link>
            </TableCell>
            <TableCell>{r.nets.mesh_size ?? "—"}</TableCell>
            <TableCell>{formatDate(r.installation_date)}</TableCell>
            <TableCell>{r.removal_date ? formatDate(r.removal_date) : <span className="font-semibold text-status-blue">Current</span>}</TableCell>
            <TableCell>{daysBetween(r.installation_date, r.removal_date ?? new Date())} days</TableCell>
            <TableCell>{r.removal_reason ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
