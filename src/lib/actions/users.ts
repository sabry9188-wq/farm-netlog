"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS, type Permission } from "@/lib/permissions";
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

export async function createUserWithPasswordAction(input: {
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
}) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (error) return { error: error.message };

  if (data.user) {
    await admin
      .from("profiles")
      .update({ full_name: input.fullName, role: input.role, permissions: ROLE_DEFAULT_PERMISSIONS[input.role] })
      .eq("id", data.user.id);
  }

  revalidatePath("/users");
  return { data: true };
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
    await admin
      .from("profiles")
      .update({ full_name: input.fullName, role: input.role, permissions: ROLE_DEFAULT_PERMISSIONS[input.role] })
      .eq("id", data.user.id);
  }

  revalidatePath("/users");
  return { data: true };
}

// Lets an Admin give someone a new password directly — no email involved —
// for when a user is locked out and the recovery email can't be delivered.
export async function setUserPasswordAction(input: { userId: string; password: string }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  if (input.password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(input.userId, { password: input.password });
  if (error) return { error: error.message };

  return { data: true };
}

export async function updateUserRoleAction(input: { userId: string; role: UserRole }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  // A new role starts from that role's usual permissions; Admin can fine-tune them in Settings → Permissions.
  const { error } = await check.supabase
    .from("profiles")
    .update({ role: input.role, permissions: ROLE_DEFAULT_PERMISSIONS[input.role] })
    .eq("id", input.userId);
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

export async function setUserPermissionAction(input: { userId: string; permission: Permission; enabled: boolean }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };
  if (!PERMISSIONS.some((p) => p.key === input.permission)) return { error: "Unknown permission." };

  // Read the current list fresh so two quick toggles don't overwrite each other.
  const { data: target, error: readError } = await check.supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", input.userId)
    .single();
  if (readError || !target) return { error: readError?.message ?? "User not found." };
  if (target.role === "admin") return { error: "Admin always has every permission." };

  const current = new Set<string>(target.permissions ?? []);
  if (input.enabled) current.add(input.permission);
  else current.delete(input.permission);

  const { error } = await check.supabase.from("profiles").update({ permissions: [...current] }).eq("id", input.userId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/users");
  return { data: true };
}

export async function resetUserPermissionsAction(input: { userId: string }) {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const { data: target } = await check.supabase.from("profiles").select("role").eq("id", input.userId).single();
  if (!target) return { error: "User not found." };

  const { error } = await check.supabase
    .from("profiles")
    .update({ permissions: ROLE_DEFAULT_PERMISSIONS[target.role as UserRole] })
    .eq("id", input.userId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { data: true };
}