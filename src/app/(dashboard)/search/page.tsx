import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { siteSlug } from "@/lib/constants";
import type { Net, VCageCurrentState } from "@/lib/types/database";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  let nets: (Net & { sites: { site_code: string } })[] = [];
  let cages: VCageCurrentState[] = [];

  if (query) {
    const [netsRes, cagesRes] = await Promise.all([
      supabase
        .from("nets")
        .select("*, sites(site_code)")
        .or(`net_code.ilike.%${query}%,mesh_size.ilike.%${query}%,status.ilike.%${query}%,condition.ilike.%${query}%`)
        .limit(50),
      supabase.from("v_cage_current_state").select("*").ilike("cage_code", `%${query}%`).limit(50),
    ]);
    nets = (netsRes.data as (Net & { sites: { site_code: string } })[]) ?? [];
    cages = (cagesRes.data as VCageCurrentState[]) ?? [];
  }

  return (
    <div>
      <PageHeader title="Search Results" description={query ? `Results for "${query}"` : "Enter a search term."} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Nets ({nets.length})</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {nets.length === 0 && <p className="py-4 text-sm text-muted-foreground">No nets found.</p>}
            {nets.map((n) => (
              <Link key={n.id} href={`/nets/${n.net_code}`} className="-mx-2 flex items-center justify-between rounded-lg px-2 py-2.5 text-sm hover:bg-muted/50">
                <div>
                  <p className="font-mono font-semibold">{n.net_code}</p>
                  <p className="text-xs text-muted-foreground">{n.sites?.site_code} · {n.mesh_size ?? "—"}</p>
                </div>
                <StatusBadge status={n.status} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Cages ({cages.length})</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {cages.length === 0 && <p className="py-4 text-sm text-muted-foreground">No cages found.</p>}
            {cages.map((c) => (
              <Link key={c.cage_id} href={`/cages/${siteSlug(c.site_code)}/${c.cage_code}`} className="-mx-2 flex items-center justify-between rounded-lg px-2 py-2.5 text-sm hover:bg-muted/50">
                <div>
                  <p className="font-mono font-semibold">{c.cage_code}</p>
                  <p className="text-xs text-muted-foreground">{c.site_name}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{c.main_net_code ?? "No net"}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
