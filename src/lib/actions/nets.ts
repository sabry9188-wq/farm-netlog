"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVAILABLE_STATUSES } from "@/lib/constants";
import type { Net, NetCategory } from "@/lib/types/database";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function fetchEligibleNetsAction(input: {
  siteId: string;
  category: NetCategory;
  mesh?: string;
}): Promise<Net[]> {
  const supabase = await createClient();
  let query = supabase
    .from("nets")
    .select("*")
    .eq("site_id", input.siteId)
    .eq("category", input.category)
    .in("status", AVAILABLE_STATUSES)
    .order("net_code");
  if (input.mesh) query = query.eq("mesh_size", input.mesh);
  const { data } = await query;
  return (data as Net[]) ?? [];
}

async function callRpc<T>(fn: string, args: Record<string, unknown>): Promise<ActionResult<T>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  return { data: data as T };
}

function revalidateCommon(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function registerNetAction(net: Record<string, unknown>): Promise<ActionResult> {
  const res = await callRpc("fn_register_net", { p_net: net });
  revalidateCommon(["/nets", "/store", "/dashboard", "/top-nets", "/guard-nets"]);
  return res;
}

export async function updateNetAction(netId: string, updates: Record<string, unknown>): Promise<ActionResult> {
  const res = await callRpc("fn_update_net", { p_net_id: netId, p_updates: updates });
  revalidateCommon(["/nets", "/store", "/top-nets", "/guard-nets"]);
  return res;
}

export async function deleteNetAction(netId: string): Promise<ActionResult> {
  const res = await callRpc("fn_delete_net", { p_net_id: netId });
  revalidateCommon(["/nets", "/store", "/dashboard", "/top-nets", "/guard-nets"]);
  return res;
}

export async function installNetAction(input: {
  netId: string;
  cageId: string;
  installationDate?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_install_net", {
    p_net_id: input.netId,
    p_cage_id: input.cageId,
    p_installation_date: input.installationDate ?? new Date().toISOString().slice(0, 10),
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/nets", "/store", "/dashboard", "/cages", "/alerts", "/movements"]);
  return res;
}

export async function removeNetAction(input: {
  netId: string;
  removalDate?: string;
  removalReason: string;
  condition: string;
  destination: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_remove_net", {
    p_net_id: input.netId,
    p_removal_date: input.removalDate ?? new Date().toISOString().slice(0, 10),
    p_removal_reason: input.removalReason,
    p_condition: input.condition,
    p_destination: input.destination,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/nets", "/store", "/dashboard", "/cages", "/alerts", "/cleaning", "/repair", "/movements"]);
  return res;
}

export async function changeNetAction(input: {
  oldNetId: string;
  newNetId: string;
  removalReason: string;
  conditionAtRemoval?: string;
  changeDate?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_change_net", {
    p_old_net_id: input.oldNetId,
    p_new_net_id: input.newNetId,
    p_removal_reason: input.removalReason,
    p_condition_at_removal: input.conditionAtRemoval ?? null,
    p_change_date: input.changeDate ?? new Date().toISOString().slice(0, 10),
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/nets", "/store", "/dashboard", "/cages", "/alerts", "/movements", "/install"]);
  return res;
}

export async function sendToCleaningAction(input: {
  netId: string;
  startDate?: string;
  method?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_send_to_cleaning", {
    p_net_id: input.netId,
    p_start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
    p_method: input.method ?? null,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/cleaning", "/nets", "/store", "/dashboard"]);
  return res;
}

export async function completeCleaningAction(input: {
  netId: string;
  completionDate?: string;
  conditionAfter: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_complete_cleaning", {
    p_net_id: input.netId,
    p_completion_date: input.completionDate ?? new Date().toISOString().slice(0, 10),
    p_condition_after: input.conditionAfter,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/cleaning", "/nets", "/store", "/dashboard"]);
  return res;
}

export async function sendToRepairAction(input: {
  netId: string;
  repairStart?: string;
  damageDescription?: string;
  repairType?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_send_to_repair", {
    p_net_id: input.netId,
    p_repair_start: input.repairStart ?? new Date().toISOString().slice(0, 10),
    p_damage_description: input.damageDescription ?? null,
    p_repair_type: input.repairType ?? null,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/repair", "/nets", "/store", "/dashboard"]);
  return res;
}

export async function completeRepairAction(input: {
  netId: string;
  repairCompletion?: string;
  conditionAfter: string;
  cost?: number;
  outcome: "Ready for Use" | "Beyond Repair";
  performedBy?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_complete_repair", {
    p_net_id: input.netId,
    p_repair_completion: input.repairCompletion ?? new Date().toISOString().slice(0, 10),
    p_condition_after: input.conditionAfter,
    p_cost: input.cost ?? null,
    p_outcome: input.outcome,
    p_performed_by: input.performedBy ?? null,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/repair", "/nets", "/store", "/dashboard"]);
  return res;
}

export async function disposeNetAction(input: {
  netId: string;
  disposalDate?: string;
  reason: string;
  condition?: string;
  method?: string;
  performedBy?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_dispose_net", {
    p_net_id: input.netId,
    p_disposal_date: input.disposalDate ?? new Date().toISOString().slice(0, 10),
    p_reason: input.reason,
    p_condition: input.condition ?? null,
    p_method: input.method ?? null,
    p_performed_by: input.performedBy ?? null,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/nets", "/store", "/dashboard", "/reports"]);
  return res;
}

export async function markLostAction(input: {
  netId: string;
  dateLost?: string;
  lastKnownLocation?: string;
  reason: string;
  remarks?: string;
}): Promise<ActionResult> {
  const res = await callRpc("fn_mark_lost", {
    p_net_id: input.netId,
    p_date_lost: input.dateLost ?? new Date().toISOString().slice(0, 10),
    p_last_known_location: input.lastKnownLocation ?? null,
    p_reason: input.reason,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/nets", "/store", "/dashboard", "/cages"]);
  return res;
}

export async function setReservedAction(input: { netId: string; reserved: boolean; remarks?: string }): Promise<ActionResult> {
  const res = await callRpc("fn_set_reserved", {
    p_net_id: input.netId,
    p_reserved: input.reserved,
    p_remarks: input.remarks ?? null,
  });
  revalidateCommon(["/nets", "/store"]);
  return res;
}
