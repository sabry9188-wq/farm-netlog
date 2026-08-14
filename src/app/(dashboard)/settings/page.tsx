import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LookupEditor } from "@/components/settings/lookup-editor";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import type { LookupRow, SystemSetting } from "@/lib/types/database";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [meshSizes, conditions, statuses, removalReasons, repairTypes, disposalReasons, systemSettings] = await Promise.all([
    supabase.from("mesh_sizes").select("*").order("sort_order"),
    supabase.from("net_conditions").select("*").order("sort_order"),
    supabase.from("net_statuses").select("*").order("sort_order"),
    supabase.from("removal_reasons").select("*").order("sort_order"),
    supabase.from("repair_types").select("*").order("sort_order"),
    supabase.from("disposal_reasons").select("*").order("sort_order"),
    supabase.from("system_settings").select("*").order("key"),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Configure the controlled lists and thresholds the whole system uses." />

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="mesh">Mesh Sizes</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="removal">Removal Reasons</TabsTrigger>
          <TabsTrigger value="repair">Repair Types</TabsTrigger>
          <TabsTrigger value="disposal">Disposal Reasons</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card><CardHeader><CardTitle className="text-base">Net Change Period &amp; Alert Thresholds</CardTitle></CardHeader>
            <CardContent><SystemSettingsForm settings={(systemSettings.data as SystemSetting[]) ?? []} /></CardContent>
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
      </Tabs>
    </div>
  );
}
