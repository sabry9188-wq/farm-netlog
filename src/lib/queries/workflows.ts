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

export interface InCageCleaningRow {
  id: string;
  start_date: string;
  completion_date: string | null;
  method: string | null;
  adequate: boolean | null;
  remarks: string | null;
  cycle: number;
  nets: { net_code: string; physical_number: string | null } | null;
  cages: { cage_code: string } | null;
}

/**
 * All in-cage cleaning log entries (cleaning_records with a cage_id —
 * i.e. logged while the net stayed installed), each tagged with which
 * numbered cleaning cycle it is for that net across its FULL cleaning
 * history (in-cage and removed-for-cleaning combined), newest first.
 */
export async function getInCageCleaningLog(supabase: SB): Promise<InCageCleaningRow[]> {
  const { data } = await supabase
    .from("cleaning_records")
    .select("id, net_id, cage_id, start_date, completion_date, method, adequate, remarks, nets(net_code, physical_number), cages(cage_code)")
    .order("net_id", { ascending: true })
    .order("start_date", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]) ?? [];
  const cycleByNet = new Map<string, number>();
  const withCycle: InCageCleaningRow[] = rows.map((r) => {
    const cycle = (cycleByNet.get(r.net_id) ?? 0) + 1;
    cycleByNet.set(r.net_id, cycle);
    return { ...r, cycle };
  });

  return withCycle.filter((r) => (r as unknown as { cage_id: string | null }).cage_id).sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
}

export async function getRepairHistory(supabase: SB) {
  const { data } = await supabase
    .from("repair_records")
    .select("*, nets(net_code, category, site_id, sites(site_code))")
    .order("repair_start", { ascending: false })
    .limit(200);
  return data ?? [];
}
