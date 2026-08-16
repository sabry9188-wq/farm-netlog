import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteByCode, getCagesForSite } from "@/lib/queries/cages";
import { getCurrentProfile, canWrite } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertBadge } from "@/components/shared/alert-badge";
import { InstallNetDialog } from "@/components/nets/install-net-dialog";
import { ChangeNetDialog } from "@/components/nets/change-net-dialog";
import { RemoveNetDialog } from "@/components/nets/remove-net-dialog";
import { formatDate } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { NetCategory, VCageCurrentState } from "@/lib/types/database";

const CATEGORY_TABS: { value: NetCategory; label: string }[] = [
  { value: "MAIN_NET", label: "Main Nets" },
  { value: "GUARD_NET", label: "Guard Nets" },
  { value: "TOP_NET", label: "Top Nets" },
];

function categoryInfo(cage: VCageCurrentState, category: NetCategory) {
  if (category === "MAIN_NET") {
    return {
      netId: cage.main_net_id,
      netCode: cage.main_net_code,
      mesh: cage.main_net_mesh,
      installDate: cage.main_net_installation_date,
      daysRemaining: cage.main_net_days_remaining,
    };
  }
  if (category === "GUARD_NET") {
    return {
      netId: cage.guard_net_id,
      netCode: cage.guard_net_code,
      mesh: "80 mm",
      installDate: cage.guard_net_installation_date,
      daysRemaining: null as number | null,
    };
  }
  return {
    netId: cage.top_net_id,
    netCode: cage.top_net_code,
    mesh: null as string | null,
    installDate: cage.top_net_installation_date,
    daysRemaining: null as number | null,
  };
}

export default async function InstallChangeNetPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const { site: siteFilter } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const writable = canWrite(profile?.role);

  const [st05, offs] = await Promise.all([getSiteByCode(supabase, "ST05"), getSiteByCode(supabase, "OFFS")]);
  const [st05Cages, offsCages] = await Promise.all([
    st05 ? getCagesForSite(supabase, st05.id) : [],
    offs ? getCagesForSite(supabase, offs.id) : [],
  ]);
  let cages = [...st05Cages, ...offsCages];
  if (siteFilter === "ST05" || siteFilter === "OFFS") {
    cages = cages.filter((c) => c.site_code === siteFilter);
  }

  return (
    <div>
      <PageHeader
        title="Install / Change Net"
        description="Install into an empty cage, change an existing net for a new one, or remove a net (harvest, disposal, etc.)."
      />

      <div className="mb-4 flex gap-2">
        <SiteFilterLink current={siteFilter} value={undefined} label="All Sites" />
        <SiteFilterLink current={siteFilter} value="ST05" label="Station-05" />
        <SiteFilterLink current={siteFilter} value="OFFS" label="Offshore" />
      </div>

      <Tabs defaultValue="MAIN_NET">
        <TabsList>
          {CATEGORY_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {CATEGORY_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cage</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Current Net</TableHead>
                      <TableHead>Mesh</TableHead>
                      <TableHead>Status</TableHead>
                      {writable && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cages.map((cage) => {
                      const info = categoryInfo(cage, t.value);
                      const siteSlug = cage.site_code === "ST05" ? "station-05" : "offshore";
                      return (
                        <TableRow key={cage.cage_id}>
                          <TableCell className="font-mono font-bold">
                            <Link href={`/cages/${siteSlug}/${cage.cage_code}`} className="hover:underline">
                              {cage.cage_code}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{cage.site_name}</TableCell>
                          <TableCell className="font-mono">
                            {info.netCode ? (
                              <Link href={`/nets/${info.netCode}`} className="text-primary hover:underline">
                                {info.netCode}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground italic">None</span>
                            )}
                          </TableCell>
                          <TableCell>{info.mesh ?? "—"}</TableCell>
                          <TableCell>
                            {info.daysRemaining !== null ? (
                              <AlertBadge daysRemaining={info.daysRemaining} />
                            ) : info.installDate ? (
                              <span className="text-sm text-muted-foreground">Installed {formatDate(info.installDate)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No net assigned</span>
                            )}
                          </TableCell>
                          {writable && (
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                {info.netId ? (
                                  <>
                                    <ChangeNetDialog
                                      oldNetId={info.netId}
                                      oldNetCode={info.netCode!}
                                      cageCode={cage.cage_code}
                                      siteId={cage.site_id}
                                      category={t.value}
                                      small
                                    />
                                    <RemoveNetDialog netId={info.netId} netCode={info.netCode!} cageCode={cage.cage_code} />
                                  </>
                                ) : (
                                  <InstallNetDialog
                                    cageId={cage.cage_id}
                                    cageCode={cage.cage_code}
                                    siteId={cage.site_id}
                                    category={t.value}
                                    triggerLabel="Install"
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SiteFilterLink({ current, value, label }: { current: string | undefined; value: string | undefined; label: string }) {
  const active = current === value || (!current && !value);
  const href = value ? `/install?site=${value}` : "/install";
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </Link>
  );
}
