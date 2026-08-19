import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CleaningRecord,
  DisposalRecord,
  LostRecord,
  Net,
  NetCategory,
  NetInstallation,
  NetMovement,
  RepairRecord,
  Site,
  VNetLifecycleStats,
} from "@/lib/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>;

export interface NetWithSite extends Net {
  sites: Pick<Site, "site_code" | "site_name">;
}

export interface NetFilters {
  siteCode?: string;
  category?: NetCategory;
  mesh?: string;
  status?: string;
  condition?: string;
  q?: string;
}

export async function getNets(supabase: SB, filters: NetFilters = {}): Promise<NetWithSite[]> {
  let query = supabase.from("nets").select("*, sites(site_code, site_name)").order("net_code");

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.mesh) query = query.eq("mesh_size", filters.mesh);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.q) query = query.ilike("net_code", `%${filters.q}%`);
  if (filters.siteCode) {
    const { data: site } = await supabase.from("sites").select("id").eq("site_code", filters.siteCode).single();
    if (site) query = query.eq("site_id", site.id);
  }

  const { data } = await query;
  return (data as NetWithSite[]) ?? [];
}

export interface NetProfile {
  net: NetWithSite;
  installations: (NetInstallation & { cages: { cage_code: string } })[];
  movements: NetMovement[];
  cleaning: CleaningRecord[];
  repairs: RepairRecord[];
  disposal: DisposalRecord | null;
  lost: LostRecord | null;
  stats: VNetLifecycleStats | null;
}

export async function getNetProfile(supabase: SB, netCode: string): Promise<NetProfile | null> {
  const { data: net } = await supabase.from("nets").select("*, sites(site_code, site_name)").eq("net_code", netCode).single();
  if (!net) return null;

  const [installationsRes, movementsRes, cleaningRes, repairsRes, disposalRes, lostRes, statsRes] = await Promise.all([
    supabase
      .from("net_installations")
      .select("*, cages(cage_code)")
      .eq("net_id", net.id)
      .order("installation_date", { ascending: false }),
    supabase.from("net_movements").select("*").eq("net_id", net.id).order("movement_date", { ascending: false }),
    supabase.from("cleaning_records").select("*").eq("net_id", net.id).order("start_date", { ascending: false }),
    supabase.from("repair_records").select("*").eq("net_id", net.id).order("repair_start", { ascending: false }),
    supabase.from("disposal_records").select("*").eq("net_id", net.id).maybeSingle(),
    supabase.from("lost_records").select("*").eq("net_id", net.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("v_net_lifecycle_stats").select("*").eq("net_id", net.id).single(),
  ]);

  return {
    net: net as NetWithSite,
    installations: (installationsRes.data as NetProfile["installations"]) ?? [],
    movements: (movementsRes.data as NetMovement[]) ?? [],
    cleaning: (cleaningRes.data as CleaningRecord[]) ?? [],
    repairs: (repairsRes.data as RepairRecord[]) ?? [],
    disposal: (disposalRes.data as DisposalRecord) ?? null,
    lost: (lostRes.data as LostRecord) ?? null,
    stats: (statsRes.data as VNetLifecycleStats) ?? null,
  };
}

export interface LostNetRow {
  net: NetWithSite;
  record: LostRecord | null;
}

export async function getLostNets(supabase: SB): Promise<LostNetRow[]> {
  const { data: nets } = await supabase.from("nets").select("*, sites(site_code, site_name)").eq("status", "Lost").order("net_code");
  const netIds = ((nets as NetWithSite[]) ?? []).map((n) => n.id);
  const { data: records } = netIds.length
    ? await supabase.from("lost_records").select("*").in("net_id", netIds).order("created_at", { ascending: false })
    : { data: [] };

  const recordByNet = new Map<string, LostRecord>();
  for (const r of (records as LostRecord[]) ?? []) if (!recordByNet.has(r.net_id)) recordByNet.set(r.net_id, r);

  return ((nets as NetWithSite[]) ?? []).map((n) => ({ net: n, record: recordByNet.get(n.id) ?? null }));
}

export interface DisposedNetRow {
  net: NetWithSite;
  record: DisposalRecord | null;
}

export async function getDisposedNets(supabase: SB): Promise<DisposedNetRow[]> {
  const { data: nets } = await supabase.from("nets").select("*, sites(site_code, site_name)").eq("status", "Disposed").order("net_code");
  const netIds = ((nets as NetWithSite[]) ?? []).map((n) => n.id);
  const { data: records } = netIds.length
    ? await supabase.from("disposal_records").select("*").in("net_id", netIds).order("created_at", { ascending: false })
    : { data: [] };

  const recordByNet = new Map<string, DisposalRecord>();
  for (const r of (records as DisposalRecord[]) ?? []) if (!recordByNet.has(r.net_id)) recordByNet.set(r.net_id, r);

  return ((nets as NetWithSite[]) ?? []).map((n) => ({ net: n, record: recordByNet.get(n.id) ?? null }));
}
