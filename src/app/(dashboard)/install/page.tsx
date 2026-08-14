import { createClient } from "@/lib/supabase/server";
import { getSiteByCode, getCagesForSite } from "@/lib/queries/cages";
import { getCurrentProfile, canWrite } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertBadge } from "@/components/shared/alert-badge";
import { InstallNetDialog } from "@/components/nets/install-net-dialog";
import { RemoveNetDialog } from "@/components/nets/remove-net-dialog";
import { formatDate } from "@/lib/calculations";
import Link from "next/link";

export default async function InstallChangeNetPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const writable = canWrite(profile?.role);

  const [st05, offs] = await Promise.all([getSiteByCode(supabase, "ST05"), getSiteByCode(supabase, "OFFS")]);
  const [st05Cages, offsCages] = await Promise.all([
    st05 ? getCagesForSite(supabase, st05.id) : [],
    offs ? getCagesForSite(supabase, offs.id) : [],
  ]);
  const cages = [...st05Cages, ...offsCages];

  return (
    <div>
      <PageHeader
        title="Install / Change Net"
        description="Fast path for the most common farm task: pick a cage, pick an available net, confirm."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cage</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Current Main Net</TableHead>
                <TableHead>Mesh</TableHead>
                <TableHead>Status</TableHead>
                {writable && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cages.map((cage) => (
                <TableRow key={cage.cage_id}>
                  <TableCell className="font-mono font-bold">
                    <Link href={`/cages/${cage.site_code === "ST05" ? "station-05" : "offshore"}/${cage.cage_code}`} className="hover:underline">
                      {cage.cage_code}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cage.site_name}</TableCell>
                  <TableCell className="font-mono">
                    {cage.main_net_code ? (
                      <Link href={`/nets/${cage.main_net_code}`} className="text-primary hover:underline">
                        {cage.main_net_code}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic">None</span>
                    )}
                  </TableCell>
                  <TableCell>{cage.main_net_mesh ?? "—"}</TableCell>
                  <TableCell>
                    {cage.main_net_days_remaining !== null ? (
                      <AlertBadge daysRemaining={cage.main_net_days_remaining} />
                    ) : cage.main_net_installation_date ? (
                      formatDate(cage.main_net_installation_date)
                    ) : (
                      <span className="text-xs text-muted-foreground">No net assigned</span>
                    )}
                  </TableCell>
                  {writable && (
                    <TableCell className="text-right">
                      {cage.main_net_id ? (
                        <RemoveNetDialog netId={cage.main_net_id} netCode={cage.main_net_code!} cageCode={cage.cage_code} />
                      ) : (
                        <InstallNetDialog
                          cageId={cage.cage_id}
                          cageCode={cage.cage_code}
                          siteId={cage.site_id}
                          category="MAIN_NET"
                          triggerLabel="Install"
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
