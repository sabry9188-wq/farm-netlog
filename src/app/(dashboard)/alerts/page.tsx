import Link from "next/link";
import { AlertTriangle, PackageX, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { AlertBadge } from "@/components/shared/alert-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import type { VCagesMissingNet, VLowStock, VNetAlertStatus } from "@/lib/types/database";

export default async function AlertsPage() {
  const supabase = await createClient();
  const [alertsRes, lowStockRes, missingRes] = await Promise.all([
    supabase.from("v_net_alert_status").select("*").order("days_remaining", { ascending: true }),
    supabase.from("v_low_stock").select("*"),
    supabase.from("v_cages_missing_net").select("*"),
  ]);

  const alerts = (alertsRes.data as VNetAlertStatus[]) ?? [];
  const lowStock = (lowStockRes.data as VLowStock[]) ?? [];
  const missing = (missingRes.data as VCagesMissingNet[]) ?? [];

  const dueSoon30 = alerts.filter((a) => a.days_remaining <= 30 && a.days_remaining > 14);
  const dueSoon14 = alerts.filter((a) => a.days_remaining <= 14 && a.days_remaining > 7);
  const dueSoon7 = alerts.filter((a) => a.days_remaining <= 7 && a.days_remaining > 0);
  const dueToday = alerts.filter((a) => a.days_remaining === 0);
  const overdue = alerts.filter((a) => a.days_remaining < 0);

  return (
    <div>
      <PageHeader title="Notification Center" description="Everything that needs farm staff attention, right now." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KpiCard label="Due ≤30 days" value={dueSoon30.length + dueSoon14.length + dueSoon7.length} accent="ocean" />
        <KpiCard label="Due ≤14 days" value={dueSoon14.length + dueSoon7.length} accent="ocean" />
        <KpiCard label="Due ≤7 days" value={dueSoon7.length} accent="orange" />
        <KpiCard label="Due Today" value={dueToday.length} accent="red" />
        <KpiCard label="Overdue" value={overdue.length} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <AlertTriangle className="size-4 text-status-orange" />
            <CardTitle className="text-base">Net Change Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open installations.</p>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((a) => (
                  <Link
                    key={a.installation_id}
                    href={`/nets/${a.net_code}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono font-bold">{a.cage_code}</span>
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

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <PackageX className="size-4 text-status-red" />
              <CardTitle className="text-base">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No mesh sizes below their minimum.</p>
              ) : (
                <ul className="space-y-2">
                  {lowStock.map((s, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-status-red-bg px-3 py-2 text-sm">
                      <span className="font-medium text-status-red">
                        {s.site_code} · {s.mesh_size}
                      </span>
                      <span className="font-mono font-bold text-status-red">
                        {s.current_qty} / {s.minimum_qty} min
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <ShieldAlert className="size-4 text-status-grey" />
              <CardTitle className="text-base">Cages Missing a Net</CardTitle>
            </CardHeader>
            <CardContent>
              {missing.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Every cage has a main, guard, and top net assigned.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {missing.map((m) => (
                    <li key={m.cage_id} className="flex items-center justify-between">
                      <Link href={`/cages/${m.site_code === "ST05" ? "station-05" : "offshore"}/${m.cage_code}`} className="font-mono font-semibold text-primary hover:underline">
                        {m.cage_code}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {[m.missing_main_net && "main", m.missing_guard_net && "guard", m.missing_top_net && "top"].filter(Boolean).join(", ")} missing
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
