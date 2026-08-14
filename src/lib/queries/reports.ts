import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDate } from "@/lib/calculations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportDef {
  id: string;
  title: string;
  description: string;
}

export const REPORTS: ReportDef[] = [
  { id: "current-position", title: "Current Net Position Report", description: "Every net currently installed in a cage, with days remaining." },
  { id: "store-inventory", title: "Net Store Inventory Report", description: "All nets currently in the store, awaiting use." },
  { id: "cage-wise", title: "Cage-wise Net Report", description: "Every cage with its current main / guard / top net." },
  { id: "change-history", title: "Net Change History", description: "Every completed cage installation, with duration and reason." },
  { id: "upcoming-60day", title: "Upcoming 60-Day Net Change Report", description: "Nets due for change within the next 30 days." },
  { id: "overdue", title: "Overdue Net Report", description: "Nets past their expected change date." },
  { id: "cleaning-history", title: "Cleaning History", description: "Every cleaning record across the farm." },
  { id: "repair-history", title: "Repair History", description: "Every repair record across the farm." },
  { id: "disposed", title: "Disposed Net Report", description: "All disposed nets and their disposal details." },
  { id: "lost", title: "Lost Net Report", description: "All nets reported lost." },
  { id: "lifecycle", title: "Net Utilization / Lifecycle Report", description: "Cage uses, cleaning/repair cycles, and total cage days per net." },
  { id: "top-nets", title: "Top Net Report", description: "Full inventory of top/bird nets." },
  { id: "guard-nets", title: "Guard Net Report", description: "Full inventory of guard nets." },
  { id: "station05-stock", title: "Station-05 Stock Report", description: "Complete net inventory for Station-05." },
  { id: "offshore-stock", title: "Offshore Stock Report", description: "Complete net inventory for Offshore." },
  { id: "full-inventory", title: "Complete Farm Net Inventory Report", description: "Every net registered in the system, any status." },
];

export async function getReportData(supabase: SB, reportId: string): Promise<{ columns: ReportColumn[]; rows: Row[] }> {
  switch (reportId) {
    case "current-position": {
      const { data } = await supabase.from("v_net_alert_status").select("*").order("days_remaining");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "cage_code", label: "Cage" }, { key: "site_name", label: "Site" },
          { key: "mesh_size", label: "Mesh" }, { key: "installation_date", label: "Installed" },
          { key: "expected_change_date", label: "Due" }, { key: "days_remaining", label: "Days Remaining" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, installation_date: formatDate(r.installation_date), expected_change_date: formatDate(r.expected_change_date) })),
      };
    }
    case "store-inventory": {
      const { data } = await supabase.from("nets").select("*, sites(site_code)").in("status", ["Available in Store", "Ready for Use", "Ready After Repair"]).order("net_code");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "site_code", label: "Site" }, { key: "category", label: "Category" },
          { key: "mesh_size", label: "Mesh" }, { key: "condition", label: "Condition" }, { key: "status", label: "Status" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, site_code: r.sites?.site_code })),
      };
    }
    case "cage-wise": {
      const { data } = await supabase.from("v_cage_current_state").select("*").order("cage_code");
      return {
        columns: [
          { key: "cage_code", label: "Cage" }, { key: "site_name", label: "Site" }, { key: "main_net_code", label: "Main Net" },
          { key: "guard_net_code", label: "Guard Net" }, { key: "top_net_code", label: "Top Net" },
          { key: "main_net_days_remaining", label: "Main Net Days Left" },
        ],
        rows: data ?? [],
      };
    }
    case "change-history": {
      const { data } = await supabase
        .from("net_installations").select("*, nets(net_code), cages(cage_code)")
        .not("removal_date", "is", null).order("removal_date", { ascending: false }).limit(500);
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "cage_code", label: "Cage" }, { key: "installation_date", label: "Installed" },
          { key: "removal_date", label: "Removed" }, { key: "removal_reason", label: "Reason" }, { key: "destination", label: "Destination" },
        ],
        rows: (data ?? []).map((r: Row) => ({
          ...r, net_code: r.nets?.net_code, cage_code: r.cages?.cage_code,
          installation_date: formatDate(r.installation_date), removal_date: formatDate(r.removal_date),
        })),
      };
    }
    case "upcoming-60day": {
      const { data } = await supabase.from("v_net_alert_status").select("*").gte("days_remaining", 0).lte("days_remaining", 30).order("days_remaining");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "cage_code", label: "Cage" }, { key: "site_name", label: "Site" },
          { key: "expected_change_date", label: "Due Date" }, { key: "days_remaining", label: "Days Remaining" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, expected_change_date: formatDate(r.expected_change_date) })),
      };
    }
    case "overdue": {
      const { data } = await supabase.from("v_net_alert_status").select("*").lt("days_remaining", 0).order("days_remaining");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "cage_code", label: "Cage" }, { key: "site_name", label: "Site" },
          { key: "expected_change_date", label: "Was Due" }, { key: "days_remaining", label: "Days Overdue" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, expected_change_date: formatDate(r.expected_change_date), days_remaining: Math.abs(r.days_remaining) })),
      };
    }
    case "cleaning-history": {
      const { data } = await supabase.from("cleaning_records").select("*, nets(net_code)").order("start_date", { ascending: false }).limit(500);
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "start_date", label: "Start" }, { key: "completion_date", label: "Completed" },
          { key: "method", label: "Method" }, { key: "condition_before", label: "Before" }, { key: "condition_after", label: "After" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, net_code: r.nets?.net_code, start_date: formatDate(r.start_date), completion_date: formatDate(r.completion_date) })),
      };
    }
    case "repair-history": {
      const { data } = await supabase.from("repair_records").select("*, nets(net_code)").order("repair_start", { ascending: false }).limit(500);
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "repair_start", label: "Start" }, { key: "repair_completion", label: "Completed" },
          { key: "repair_type", label: "Type" }, { key: "outcome", label: "Outcome" }, { key: "cost", label: "Cost" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, net_code: r.nets?.net_code, repair_start: formatDate(r.repair_start), repair_completion: formatDate(r.repair_completion) })),
      };
    }
    case "disposed": {
      const { data } = await supabase.from("disposal_records").select("*, nets(net_code, category, mesh_size)").order("disposal_date", { ascending: false });
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "disposal_date", label: "Disposed" }, { key: "reason", label: "Reason" },
          { key: "method", label: "Method" }, { key: "condition", label: "Condition" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, net_code: r.nets?.net_code, disposal_date: formatDate(r.disposal_date) })),
      };
    }
    case "lost": {
      const { data } = await supabase.from("lost_records").select("*, nets(net_code, category)").order("date_lost", { ascending: false });
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "date_lost", label: "Date Lost" }, { key: "last_known_location", label: "Last Location" },
          { key: "reason", label: "Reason" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, net_code: r.nets?.net_code, date_lost: formatDate(r.date_lost) })),
      };
    }
    case "lifecycle": {
      const { data } = await supabase.from("v_net_lifecycle_stats").select("*").order("net_code");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "total_cage_uses", label: "Cage Uses" }, { key: "total_cage_days", label: "Cage Days" },
          { key: "cleaning_cycles", label: "Cleaning Cycles" }, { key: "repair_cycles", label: "Repair Cycles" },
          { key: "total_repair_cost", label: "Repair Cost" }, { key: "net_age_days", label: "Net Age (days)" },
        ],
        rows: data ?? [],
      };
    }
    case "top-nets":
    case "guard-nets": {
      const category = reportId === "top-nets" ? "TOP_NET" : "GUARD_NET";
      const { data } = await supabase.from("nets").select("*, sites(site_code)").eq("category", category).order("net_code");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "site_code", label: "Site" }, { key: "condition", label: "Condition" },
          { key: "status", label: "Status" }, { key: "current_location", label: "Location" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, site_code: r.sites?.site_code })),
      };
    }
    case "station05-stock":
    case "offshore-stock": {
      const siteCode = reportId === "station05-stock" ? "ST05" : "OFFS";
      const { data: site } = await supabase.from("sites").select("id").eq("site_code", siteCode).single();
      const { data } = await supabase.from("nets").select("*").eq("site_id", site?.id).order("net_code");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "category", label: "Category" }, { key: "mesh_size", label: "Mesh" },
          { key: "condition", label: "Condition" }, { key: "status", label: "Status" }, { key: "current_location", label: "Location" },
        ],
        rows: data ?? [],
      };
    }
    case "full-inventory":
    default: {
      const { data } = await supabase.from("nets").select("*, sites(site_code)").order("net_code");
      return {
        columns: [
          { key: "net_code", label: "Net ID" }, { key: "site_code", label: "Site" }, { key: "category", label: "Category" },
          { key: "mesh_size", label: "Mesh" }, { key: "condition", label: "Condition" }, { key: "status", label: "Status" },
          { key: "current_location", label: "Location" },
        ],
        rows: (data ?? []).map((r: Row) => ({ ...r, site_code: r.sites?.site_code })),
      };
    }
  }
}
