import type { SupabaseClient } from "@supabase/supabase-js";
import type { CleaningRecord, Net, RepairRecord } from "@/lib/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>;

export interface NetWithSite extends Net {
  sites: { site_code: string; site_name: string };
}

export async function getCleaningQueue(supabase: SB) {
  const { data: nets } = await supabase
    .from("nets")
    .select("*, sites(site_code, site_name)")
    .in("status", ["Sent for Cleaning", "Under Cleaning"])
    .order("net_code");

  const netIds = ((nets as NetWithSite[]) ?? []).map((n) => n.id);
  const { data: records } = netIds.length
    ? await supabase.from("cleaning_records").select("*").in("net_id", netIds).is("completion_date", null)
    : { data: [] };

  const recordByNet = new Map<string, CleaningRecord>();
  for (const r of (records as CleaningRecord[]) ?? []) recordByNet.set(r.net_id, r);

  return ((nets as NetWithSite[]) ?? []).map((n) => ({ net: n, record: recordByNet.get(n.id) ?? null }));
}

export async function getRepairQueue(supabase: SB) {
  const { data: nets } = await supabase
    .from("nets")
    .select("*, sites(site_code, site_name)")
    .eq("status", "Under Repair")
    .order("net_code");

  const netIds = ((nets as NetWithSite[]) ?? []).map((n) => n.id);
  const { data: records } = netIds.length
    ? await supabase.from("repair_records").select("*").in("net_id", netIds).is("repair_completion", null)
    : { data: [] };

  const recordByNet = new Map<string, RepairRecord>();
  for (const r of (records as RepairRecord[]) ?? []) recordByNet.set(r.net_id, r);

  return ((nets as NetWithSite[]) ?? []).map((n) => ({ net: n, record: recordByNet.get(n.id) ?? null }));
}

export async function getCleaningHistory(supabase: SB) {
  const { data } = await supabase
    .from("cleaning_records")
    .select("*, nets(net_code, category, site_id, sites(site_code))")
    .order("start_date", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getRepairHistory(supabase: SB) {
  const { data } = await supabase
    .from("repair_records")
    .select("*, nets(net_code, category, site_id, sites(site_code))")
    .order("repair_start", { ascending: false })
    .limit(200);
  return data ?? [];
}
