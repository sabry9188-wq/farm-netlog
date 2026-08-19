import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getNetProfile } from "@/lib/queries/nets";
import { getCurrentProfile } from "@/lib/auth";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetActionsBar } from "@/components/nets/net-actions-bar";
import { MovementTimeline } from "@/components/nets/movement-timeline";
import { formatDate, daysBetween } from "@/lib/calculations";
import { CATEGORY_LABELS } from "@/lib/constants";

export default async function NetProfilePage({ params }: { params: Promise<{ netCode: string }> }) {
  const { netCode } = await params;
  const supabase = await createClient();
  const [profile, currentUser] = await Promise.all([getNetProfile(supabase, netCode), getCurrentProfile()]);
  if (!profile) notFound();

  const { net, installations, movements, cleaning, repairs, disposal, lost, stats } = profile;
  const openInstallation = installations.find((i) => !i.removal_date);
  const previousCages = Array.from(new Set(installations.map((i) => i.cages?.cage_code).filter(Boolean)));
  const canDelete =
    installations.length === 0 && cleaning.length === 0 && repairs.length === 0 && !disposal && !lost;

  return (
    <div>
      <Link href="/nets" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Net Inventory
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-foreground sm:text-3xl">{net.net_code}</h1>
            <StatusBadge status={net.status} />
          </div>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {net.mesh_size ? `${net.mesh_size} ` : ""}
            {CATEGORY_LABELS[net.category]} · {net.sites?.site_name}
          </p>
        </div>
        {currentUser && (
          <NetActionsBar
            net={net}
            role={currentUser.role}
            cageCode={openInstallation?.cages?.cage_code}
            canDelete={canDelete}
            siteCode={net.sites?.site_code}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Net Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Mesh" value={net.mesh_size ?? "—"} />
            <Row label="Diameter" value={net.diameter_m ? `${net.diameter_m} m` : "—"} />
            <Row label="Depth" value={net.depth_m ? `${net.depth_m} m` : "—"} />
            {net.length_m && <Row label="Length" value={`${net.length_m} m`} />}
            {net.width_m && <Row label="Width" value={`${net.width_m} m`} />}
            <Row label="Material" value={net.material ?? "—"} />
            <Row label="Manufacturer" value={net.manufacturer ?? "—"} />
            <Row label="Supplier" value={net.supplier ?? "—"} />
            <Row label="Purchase date" value={formatDate(net.purchase_date)} />
            <Row label="Purchase cost" value={net.purchase_cost ? `$${net.purchase_cost.toLocaleString()}` : "—"} />
            <Row label="Condition" value={net.condition} />
            <Row label="New / Used" value={net.is_new ? "New" : "Used"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lifetime</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Cage uses" value={stats?.total_cage_uses ?? 0} />
            <Row label="Total cage days" value={stats?.total_cage_days ?? 0} />
            <Row label="Cleaning cycles" value={stats?.cleaning_cycles ?? 0} />
            <Row label="Repair cycles" value={stats?.repair_cycles ?? 0} />
            <Row label="Total repair cost" value={stats?.total_repair_cost ? `$${stats.total_repair_cost.toLocaleString()}` : "$0"} />
            <Row label="Total movements" value={stats?.total_movements ?? 0} />
            <Row label="Net age" value={stats?.net_age_days ? `${stats.net_age_days} days` : "—"} />
            <Row label="First use" value={formatDate(stats?.first_use_date)} />
            <Row label="Last use" value={formatDate(stats?.last_use_date)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Current Location</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Location" value={net.current_location} />
            {openInstallation && (
              <>
                <Row label="Cage" value={openInstallation.cages?.cage_code ?? "—"} />
                <Row label="Installed" value={formatDate(openInstallation.installation_date)} />
                <Row
                  label="Next change due"
                  value={openInstallation.expected_change_date ? formatDate(openInstallation.expected_change_date) : "No fixed schedule — condition-based"}
                />
                <Row label="Days in water" value={daysBetween(openInstallation.installation_date, new Date())} />
              </>
            )}
            {disposal && (
              <>
                <Row label="Disposed" value={formatDate(disposal.disposal_date)} />
                <Row label="Reason" value={disposal.reason ?? "—"} />
              </>
            )}
            {lost && net.status === "Lost" && (
              <>
                <Row label="Date lost" value={formatDate(lost.date_lost)} />
                <Row label="Last known location" value={lost.last_known_location ?? "—"} />
              </>
            )}
            <div>
              <p className="mb-1.5 text-[11px] text-muted-foreground">Previous cages</p>
              {previousCages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No prior cage assignments</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {previousCages.map((c) => (
                    <span key={c} className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-semibold">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <MovementTimeline movements={movements} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Installation History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cage</TableHead>
                    <TableHead>Installed</TableHead>
                    <TableHead>Removed</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installations.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No installations yet.</TableCell></TableRow>
                  )}
                  {installations.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono font-semibold">{i.cages?.cage_code}</TableCell>
                      <TableCell>{formatDate(i.installation_date)}</TableCell>
                      <TableCell>{i.removal_date ? formatDate(i.removal_date) : <span className="font-semibold text-status-blue">Current</span>}</TableCell>
                      <TableCell>{i.removal_reason ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {cleaning.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Cleaning History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Start</TableHead><TableHead>Completed</TableHead><TableHead>Method</TableHead><TableHead>Condition After</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {cleaning.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{formatDate(c.start_date)}</TableCell>
                        <TableCell>{c.completion_date ? formatDate(c.completion_date) : "In progress"}</TableCell>
                        <TableCell>{c.method ?? "—"}</TableCell>
                        <TableCell>{c.condition_after ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {repairs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Repair History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Start</TableHead><TableHead>Completed</TableHead><TableHead>Type</TableHead><TableHead>Outcome</TableHead><TableHead>Cost</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.repair_start)}</TableCell>
                        <TableCell>{r.repair_completion ? formatDate(r.repair_completion) : "In progress"}</TableCell>
                        <TableCell>{r.repair_type ?? "—"}</TableCell>
                        <TableCell>{r.outcome ?? "—"}</TableCell>
                        <TableCell>{r.cost ? `$${r.cost.toLocaleString()}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
