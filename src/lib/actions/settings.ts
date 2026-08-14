"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const LOOKUP_TABLES = [
  "mesh_sizes",
  "net_conditions",
  "net_statuses",
  "removal_reasons",
  "repair_types",
  "disposal_reasons",
] as const;
type LookupTable = (typeof LOOKUP_TABLES)[number];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false as const, error: "Only Admin can change settings." };
  return { ok: true as const, supabase };
}

export async function addLookupItemAction(table: LookupTable, label: string, extra?: Record<string, unknown>) {
  if (!LOOKUP_TABLES.includes(table)) return { error: "Invalid table." };
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from(table).insert({ label, ...extra });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: true };
}

export async function toggleLookupItemAction(table: LookupTable, id: string, isActive: boolean) {
  if (!LOOKUP_TABLES.includes(table)) return { error: "Invalid table." };
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from(table).update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: true };
}

export async function updateSystemSettingAction(key: string, value: string) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from("system_settings").update({ value }).eq("key", key);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { data: true };
}

export async function upsertStockThresholdAction(input: { siteId: string; category: string; meshSize: string; minimumQty: number }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase
    .from("stock_thresholds")
    .upsert(
      { site_id: input.siteId, category: input.category, mesh_size: input.meshSize, minimum_qty: input.minimumQty },
      { onConflict: "site_id,category,mesh_size" },
    );
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/alerts");
  return { data: true };
}
