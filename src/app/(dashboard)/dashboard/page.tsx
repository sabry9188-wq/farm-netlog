import Link from "next/link";
import {
  Waves,
  Anchor,
  Package,
  Sparkles,
  Wrench,
  AlertOctagon,
  Ghost,
  Trash2,
  Clock,
  Building2,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { KpiCard } from "@/components/shared/kpi-card";
import { AlertBadge } from "@/components/shared/alert-badge";
import { StatusDonutChart } from "@/components/dashboard/status-donut-chart";
import { SiteComparisonChart } from "@/components/dashboard/site-comparison-chart";
import { SiteStatusChart } from "@/components/dashboard/site-status-chart";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { totals, bySite, alerts } = await getDashboardData(supabase);

  const statusChartData = [
    { name: "In Store", value: totals.inStore },
    { name: "Installed", value: totals.installed },
    { name: "Cleaning", value: totals.cleaning },
    { name: "Repair", value: totals.repair },
    { name: "Damaged", value: totals.damaged },
    { name: "Lost", value: totals.lost },
    { name: "Disposed", value: totals.disposed },
  ];

  const st05 = Object.values(bySite).find((b) => b.site.site_code === "ST05");
  const offs = Object.values(bySite).find((b) => b.site.site_code === "OFFS");

  const siteChartData = [
    { metric: "Installed", "Station-05": st05?.installed ?? 0, Offshore: offs?.installed ?? 0 },
    { metric: "In Store", "Station-05": st05?.inStore ?? 0, Offshore: offs?.inStore ?? 0 },
    { metric: "Cleaning", "Station-05": st05?.cleaning ?? 0, Offshore: offs?.cleaning ?? 0 },
    { metric: "Repair", "Station-05": st05?.repair ?? 0, Offshore: offs?.repair ?? 0 },
  ];

  const topAlerts = alerts.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Farm Dashboard"
        description="Where is every net in the farm right now?"
        actions={
          <Button asChild>
            <Link href="/cages">
              <Building2 className="size-4" /> View Cage Map
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Nets" value={totals.totalNets} icon={Waves} accent="aqua" href="/nets" />
        <KpiCard label="Installed" value={totals.installed} icon={Anchor} accent="ocean" href="/nets?status=Installed+in+Cage" />
        <KpiCard label="In Store" value={totals.inStore} icon={Package} accent="green" href="/store" />
        <KpiCard label="Cleaning" value={totals.cleaning} icon={Sparkles} accent="purple" href="/cleaning" />
        <KpiCard label="Repair" value={totals.repair} icon={Wrench} accent="orange" href="/repair" />
        <KpiCard label="Damaged" value={totals.damaged} icon={AlertOctagon} accent="red" href="/nets?status=Damaged" />
        <KpiCard label="Lost" value={totals.lost} icon={Ghost} accent="grey" href="/nets?status=Lost" />
        <KpiCard label="Disposed" value={totals.disposed} icon={Trash2} accent="grey" href="/nets?status=Disposed" />
        <KpiCard label="Due Soon (14d)" value={totals.dueSoon14} icon={Clock} accent="orange" href="/alerts" />
        <KpiCard label="Overdue" value={totals.overdue} icon={AlertOctagon} accent="red" href="/alerts" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-ocean-700/15">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Station-05</CardTitle>
            <span className="text-xs text-muted-foreground">{st05?.cageCount ?? 20} cages</span>
          </CardHeader>
          <CardContent>
            <SiteStatusChart
              installed={st05?.installed ?? 0}
              inStore={st05?.inStore ?? 0}
              cleaning={st05?.cleaning ?? 0}
              repair={st05?.repair ?? 0}
            />
            <SiteAlertStats dueForChange={st05?.dueForChange ?? 0} overdue={st05?.overdue ?? 0} />
            <Button asChild variant="ghost" className="mt-3 w-full justify-between">
              <Link href="/cages/station-05">
                Open Station-05 cage map <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-aqua-500/20">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Offshore</CardTitle>
            <span className="text-xs text-muted-foreground">{offs?.cageCount ?? 24} cages</span>
          </CardHeader>
          <CardContent>
            <SiteStatusChart
              installed={offs?.installed ?? 0}
              inStore={offs?.inStore ?? 0}
              cleaning={offs?.cleaning ?? 0}
              repair={offs?.repair ?? 0}
            />
            <SiteAlertStats dueForChange={offs?.dueForChange ?? 0} overdue={offs?.overdue ?? 0} />
            <Button asChild variant="ghost" className="mt-3 w-full justify-between">
              <Link href="/cages/offshore">
                Open Offshore cage map <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Calendar</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MiniCalendar />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={statusChartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Station-05 vs Offshore</CardTitle>
          </CardHeader>
          <CardContent>
            <SiteComparisonChart data={siteChartData} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Net Change Alerts</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/alerts">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {topAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No open installations yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {topAlerts.map((a) => (
                <Link
                  key={a.installation_id}
                  href={`/nets/${a.net_code}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-mono font-bold text-foreground">{a.cage_code}</span>
                    <span className="truncate font-mono text-muted-foreground">{a.net_code}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">{a.site_name}</span>
                  </div>
                  <AlertBadge daysRemaining={a.days_remaining} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SiteAlertStats({ dueForChange, overdue }: { dueForChange: number; overdue: number }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="rounded-xl bg-status-orange-bg px-3 py-2">
        <p className="text-[11px] font-semibold text-status-orange">Due for change (≤14d)</p>
        <p className="font-mono text-xl font-bold text-status-orange">{dueForChange}</p>
      </div>
      <div className="rounded-xl bg-status-red-bg px-3 py-2">
        <p className="text-[11px] font-semibold text-status-red">Overdue</p>
        <p className="font-mono text-xl font-bold text-status-red">{overdue}</p>
      </div>
    </div>
  );
}
