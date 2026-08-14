import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import type { Profile, VNetAlertStatus } from "@/lib/types/database";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as Profile | null;

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  const { data: alerts } = await supabase
    .from("v_net_alert_status")
    .select("alert_color")
    .in("alert_color", ["orange", "red"]);
  const alertCount = ((alerts as Pick<VNetAlertStatus, "alert_color">[]) ?? []).length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarNav role={profile.role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} role={profile.role} alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
