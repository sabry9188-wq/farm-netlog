import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { LookupEditor } from "@/components/settings/lookup-editor";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import { PermissionsEditor } from "@/components/settings/permissions-editor";
import { SiteChangePeriodsForm } from "@/components/settings/site-change-periods-form";
import type { LookupRow, Profile, Site, SystemSetting } from "@/lib/types/database";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [meshSizes, conditions, foulingLevels, statuses, removalReasons, repairTypes, disposalReasons, systemSettings, users, sites] = await Promise.all([
    supabase.from("mesh_sizes").select("*").order("sort_order"),
    supabase.from("net_conditions").select("*").order("sort_order"),
    supabase.from("fouling_levels").select("*").order("sort_order"),
    supabase.from("net_statuses").select("*").order("sort_order"),
    supabase.from("removal_reasons").select("*").order("sort_order"),
    supabase.from("repair_types").select("*").order("sort_order"),
    supabase.from("disposal_reasons").select("*").order("sort_order"),
    supabase.from("system_settings").select("*").order("key"),
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("sites").select("*").order("site_name"),
  ]);

  const settingsList = (systemSettings.data as SystemSetting[]) ?? [];
  const settingInt = (key: string, fallback: number) => Number(settingsList.find((s) => s.key === key)?.value ?? fallback);

  return (
    <div>
      <PageHeader title="Settings" description="Configure the controlled lists and thresholds the whole system uses." />

      <Tabs defaultValue={sp.tab ?? "general"}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="mesh">Mesh Sizes</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="fouling">Fouling Levels</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="removal">Removal Reasons</TabsTrigger>
          <TabsTrigger value="repair">Repair Types</TabsTrigger>
          <TabsTrigger value="disposal">Disposal Reasons</TabsTrigger>
          <TabsTrigger value="backup">Data Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card><CardHeader><CardTitle className="text-base">Net Change Period &amp; Alert Thresholds</CardTitle></CardHeader>
            <CardContent><SystemSettingsForm settings={settingsList} /></CardContent>
          </Card>
          <Card className="mt-4"><CardHeader><CardTitle className="text-base">Net Change Period per Site</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Overrides the farm-wide change periods above for one site. Leave a box blank to use the farm-wide value.
              </p>
              <SiteChangePeriodsForm
                sites={(sites.data as Site[]) ?? []}
                defaultMainDays={settingInt("net_change_period_days", 60)}
                defaultGuardDays={settingInt("net_change_period_days_guard", 120)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="permissions">
          <Card><CardHeader><CardTitle className="text-base">User Permissions</CardTitle></CardHeader>
            <CardContent>
              <PermissionsEditor users={(users.data as Profile[]) ?? []} initialUserId={sp.user} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mesh">
          <Card><CardHeader><CardTitle className="text-base">Mesh Sizes</CardTitle></CardHeader>
            <CardContent><LookupEditor table="mesh_sizes" items={(meshSizes.data as LookupRow[]) ?? []} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="conditions">
          <Card><CardHeader><CardTitle className="text-base">Net Conditions</CardTitle></CardHeader>
            <CardContent><LookupEditor table="net_conditions" items={(conditions.data as LookupRow[]) ?? []} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="fouling">
          <Card><CardHeader><CardTitle className="text-base">Fouling Levels</CardTitle></CardHeader>
            <CardContent><LookupEditor table="fouling_levels" items={(foulingLevels.data as LookupRow[]) ?? []} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="statuses">
          <Card><CardHeader><CardTitle className="text-base">Net Statuses</CardTitle></CardHeader>
            <CardContent><LookupEditor table="net_statuses" items={(statuses.data as LookupRow[]) ?? []} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="removal">
          <Card><CardHeader><CardTitle className="text-base">Removal Reasons</CardTitle></CardHeader>
            <CardContent><LookupEditor table="removal_reasons" items={(removalReasons.data as LookupRow[]) ?? []} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="repair">
          <Card><CardHeader><CardTitle className="text-base">Repair Types</CardTitle></CardHeader>
            <CardContent><LookupEditor table="repair_types" items={(repairTypes.data as LookupRow[]) ?? []} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="disposal">
          <Card><CardHeader><CardTitle className="text-base">Disposal Reasons</CardTitle></CardHeader>
            <CardContent><LookupEditor table="disposal_reasons" items={(disposalReasons.data as LookupRow[]) ?? []} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="backup">
          <Card>
            <CardHeader><CardTitle className="text-base">Data Backup</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Downloads every net, cage, and record in the system as one file. Supabase's free plan doesn&apos;t
                include automatic backups, so keep a copy of this saved somewhere safe (Google Drive, email to
                yourself) every week or two.
              </p>
              <Button asChild>
                <a href="/api/backup" download>
                  <DownloadCloud className="size-4" /> Download Backup
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
