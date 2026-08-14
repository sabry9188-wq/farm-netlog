import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export function canWrite(role: Profile["role"] | undefined): boolean {
  return role === "admin" || role === "storekeeper" || role === "supervisor";
}

export function isAdmin(role: Profile["role"] | undefined): boolean {
  return role === "admin";
}
