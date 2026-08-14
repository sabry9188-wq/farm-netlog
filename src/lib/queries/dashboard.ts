import type { SupabaseClient } from "@supabase/supabase-js";
import type { Site, VNetAlertStatus, VStockSummary } from "@/lib/types/database";

export interface DashboardData {
  sites: Site[];
  stockSummary: VStockSummary[];
  alerts: VNetAlertStatus[];
  totals: {
    totalNets: number;
    mainNets: number;
    guardNets: number;
    topNets: number;
    installed: number;
    inStore: number;
    cleaning: number;
    repair: number;
    damaged: number;
    lost: number;
    disposed: number;
    dueSoon30: number;
    dueSoon14: number;
    dueSoon7: number;
    dueToday: number;
    overdue: number;
  };
  bySite: Record<
    string,
    {
      site: Site;
      cageCount: number;
      installed: number;
      inStore: number;
      cleaning: number;
      repair: number;
      dueForChange: number;
      overdue: number;
    }
  >;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDashboardData(supabase: SupabaseClient<any>): Promise<DashboardData> {
  const [sitesRes, stockRes, alertsRes, cagesRes] = await Promise.all([
    supabase.from("sites").select("*").order("site_code"),
    supabase.from("v_stock_summary").select("*"),
    supabase.from("v_net_alert_status").select("*").order("days_remaining", { ascending: true }),
    supabase.from("cages").select("id, site_id"),
  ]);

  const sites = (sitesRes.data as Site[]) ?? [];
  const stockSummary = (stockRes.data as VStockSummary[]) ?? [];
  const alerts = (alertsRes.data as VNetAlertStatus[]) ?? [];
  const cages = (cagesRes.data as { id: string; site_id: string }[]) ?? [];

  const totals = {
    totalNets: 0,
    mainNets: 0,
    guardNets: 0,
    topNets: 0,
    installed: 0,
    inStore: 0,
    cleaning: 0,
    repair: 0,
    damaged: 0,
    lost: 0,
    disposed: 0,
    dueSoon30: 0,
    dueSoon14: 0,
    dueSoon7: 0,
    dueToday: 0,
    overdue: 0,
  };

  for (const row of stockSummary) {
    totals.totalNets += row.qty;
    if (row.category === "MAIN_NET") totals.mainNets += row.qty;
    if (row.category === "GUARD_NET") totals.guardNets += row.qty;
    if (row.category === "TOP_NET") totals.topNets += row.qty;
    if (row.status === "Installed in Cage") totals.installed += row.qty;
    if (row.status === "Available in Store" || row.status === "Ready for Use" || row.status === "Ready After Repair")
      totals.inStore += row.qty;
    if (row.status === "Sent for Cleaning" || row.status === "Under Cleaning") totals.cleaning += row.qty;
    if (row.status === "Under Repair") totals.repair += row.qty;
    if (row.status === "Damaged") totals.damaged += row.qty;
    if (row.status === "Lost") totals.lost += row.qty;
    if (row.status === "Disposed") totals.disposed += row.qty;
  }

  for (const a of alerts) {
    if (a.days_remaining <= 30) totals.dueSoon30++;
    if (a.days_remaining <= 14) totals.dueSoon14++;
    if (a.days_remaining <= 7 && a.days_remaining > 0) totals.dueSoon7++;
    if (a.days_remaining === 0) totals.dueToday++;
    if (a.days_remaining < 0) totals.overdue++;
  }

  const bySite: DashboardData["bySite"] = {};
  for (const site of sites) {
    const siteStock = stockSummary.filter((r) => r.site_id === site.id);
    const siteAlerts = alerts.filter((a) => a.site_id === site.id);
    bySite[site.id] = {
      site,
      cageCount: cages.filter((c) => c.site_id === site.id).length,
      installed: siteStock.filter((r) => r.status === "Installed in Cage").reduce((n, r) => n + r.qty, 0),
      inStore: siteStock
        .filter((r) => ["Available in Store", "Ready for Use", "Ready After Repair"].includes(r.status))
        .reduce((n, r) => n + r.qty, 0),
      cleaning: siteStock
        .filter((r) => ["Sent for Cleaning", "Under Cleaning"].includes(r.status))
        .reduce((n, r) => n + r.qty, 0),
      repair: siteStock.filter((r) => r.status === "Under Repair").reduce((n, r) => n + r.qty, 0),
      dueForChange: siteAlerts.filter((a) => a.days_remaining <= 14 && a.days_remaining >= 0).length,
      overdue: siteAlerts.filter((a) => a.days_remaining < 0).length,
    };
  }

  return { sites, stockSummary, alerts, totals, bySite };
}
