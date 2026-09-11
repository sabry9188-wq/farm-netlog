"use server";

import { createClient } from "@/lib/supabase/server";

export async function markNotificationsSeenAction(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_mark_notifications_seen");
  if (error) return { error: error.message };
  return {};
}
