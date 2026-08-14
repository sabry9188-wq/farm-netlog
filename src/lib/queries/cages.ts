import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cage, NetInstallation, Net, Site, VCageCurrentState } from "@/lib/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>;

export async function getSiteByCode(supabase: SB, siteCode: string): Promise<Site | null> {
  const { data } = await supabase.from("sites").select("*").eq("site_code", siteCode).single();
  return (data as Site) ?? null;
}

export async function getCagesForSite(supabase: SB, siteId: string): Promise<VCageCurrentState[]> {
  const { data } = await supabase
    .from("v_cage_current_state")
    .select("*")
    .eq("site_id", siteId)
    .order("cage_code");
  return (data as VCageCurrentState[]) ?? [];
}

export async function getCageDetail(supabase: SB, cageCode: string): Promise<VCageCurrentState | null> {
  const { data } = await supabase.from("v_cage_current_state").select("*").eq("cage_code", cageCode).single();
  return (data as VCageCurrentState) ?? null;
}

export async function getCageRow(supabase: SB, cageCode: string): Promise<Cage | null> {
  const { data } = await supabase.from("cages").select("*").eq("cage_code", cageCode).single();
  return (data as Cage) ?? null;
}

export interface InstallationWithNet extends NetInstallation {
  nets: Net;
}

export async function getCageInstallationHistory(supabase: SB, cageId: string): Promise<InstallationWithNet[]> {
  const { data } = await supabase
    .from("net_installations")
    .select("*, nets(*)")
    .eq("cage_id", cageId)
    .order("installation_date", { ascending: false });
  return (data as InstallationWithNet[]) ?? [];
}
