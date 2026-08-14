import { Suspense } from "react";
import { Package, Sparkles, Wrench, Bookmark, AlertOctagon, Ghost, Trash2, Bird, Shield, Waves } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getNets } from "@/lib/queries/nets";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { NetsFilterBar } from "@/components/nets/nets-filter-bar";
import { NetsTable } from "@/components/nets/nets-table";
import { RegisterNetDialog } from "@/components/nets/register-net-dialog";
import type { NetCategory } from "@/lib/types/database";

export default async function NetStorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [nets, { totals }, profile] = await Promise.all([
    getNets(supabase, {
      siteCode: sp.site,
      category: sp.category as NetCategory | undefined,
      mesh: sp.mesh,
      status: sp.status,
      condition: sp.condition,
      q: sp.q,
    }),
    getDashboardData(supabase),
    getCurrentProfile(),
  ]);

  const canRegister = profile?.role === "admin" || profile?.role === "storekeeper";

  return (
    <div>
      <PageHeader
        title="Net Store"
        description="Every physical net's current status and location, farm-wide."
        actions={canRegister ? <RegisterNetDialog /> : undefined}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Nets" value={totals.totalNets} icon={Waves} accent="ocean" />
        <KpiCard label="Available" value={totals.inStore} icon={Package} accent="green" />
        <KpiCard label="Under Cleaning" value={totals.cleaning} icon={Sparkles} accent="purple" />
        <KpiCard label="Under Repair" value={totals.repair} icon={Wrench} accent="orange" />
        <KpiCard label="Reserved" value={0} icon={Bookmark} accent="ocean" hint="See filters" />
        <KpiCard label="Damaged" value={totals.damaged} icon={AlertOctagon} accent="red" />
        <KpiCard label="Lost" value={totals.lost} icon={Ghost} accent="grey" />
        <KpiCard label="Disposed" value={totals.disposed} icon={Trash2} accent="grey" />
        <KpiCard label="Top Nets" value={totals.topNets} icon={Bird} accent="ocean" />
        <KpiCard label="Guard Nets" value={totals.guardNets} icon={Shield} accent="ocean" />
      </div>

      <Suspense>
        <NetsFilterBar />
      </Suspense>
      <NetsTable nets={nets} />
    </div>
  );
}
