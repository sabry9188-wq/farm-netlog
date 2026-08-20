import type { SupabaseClient } from "@supabase/supabase-js";
import type { Site } from "@/lib/types/database";

export interface SiteStat {
  site: Site;
  cageCount: number;
  netCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSiteStats(supabase: SupabaseClient<any>): Promise<SiteStat[]> {
  const [sitesRes, cagesRes, netsRes] = await Promise.all([
    supabase.from("sites").select("*").order("site_code"),
    supabase.from("cages").select("id, site_id"),
    supabase.from("nets").select("id, site_id"),
  ]);

  const sites = (sitesRes.data as Site[]) ?? [];
  const cages = (cagesRes.data as { id: string; site_id: string }[]) ?? [];
  const nets = (netsRes.data as { id: string; site_id: string }[]) ?? [];

  return sites.map((site) => ({
    site,
    cageCount: cages.filter((c) => c.site_id === site.id).length,
    netCount: nets.filter((n) => n.site_id === site.id).length,
  }));
}
