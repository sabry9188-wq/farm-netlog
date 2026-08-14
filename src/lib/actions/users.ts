"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false as const, error: "Only Admin can manage users." };

  return { ok: true as const, supabase };
}

export async function inviteUserAction(input: { email: string; fullName: string; role: UserRole }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.fullName },
  });
  if (error) return { error: error.message };

  if (data.user) {
    await admin.from("profiles").update({ full_name: input.fullName, role: input.role }).eq("id", data.user.id);
  }

  revalidatePath("/users");
  return { data: true };
}

export async function updateUserRoleAction(input: { userId: string; role: UserRole }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from("profiles").update({ role: input.role }).eq("id", input.userId);
  if (error) return { error: error.message };

  revalidatePath("/users");
  return { data: true };
}

export async function setUserStatusAction(input: { userId: string; status: "active" | "inactive" }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from("profiles").update({ status: input.status }).eq("id", input.userId);
  if (error) return { error: error.message };

  revalidatePath("/users");
  return { data: true };
}

export async function setCanApproveDisposalAction(input: { userId: string; canApprove: boolean }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from("profiles").update({ can_approve_disposal: input.canApprove }).eq("id", input.userId);
  if (error) return { error: error.message };

  revalidatePath("/users");
  return { data: true };
}
