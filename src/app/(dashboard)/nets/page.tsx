import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getNets } from "@/lib/queries/nets";
import { getCurrentProfile, can } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { NetsFilterBar } from "@/components/nets/nets-filter-bar";
import { NetsTable } from "@/components/nets/nets-table";
import { RegisterNetDialog } from "@/components/nets/register-net-dialog";
import type { NetCategory } from "@/lib/types/database";

export default async function NetsInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [nets, profile] = await Promise.all([
    getNets(supabase, {
      siteCode: sp.site,
      category: sp.category as NetCategory | undefined,
      mesh: sp.mesh,
      status: sp.status,
      condition: sp.condition,
      q: sp.q,
    }),
    getCurrentProfile(),
  ]);

  const canRegister = can(profile, "nets_manage");
  const hasFilters = Boolean(sp.site || sp.category || sp.mesh || sp.status || sp.condition || sp.q);
  const netCount = `${nets.length} net${nets.length === 1 ? "" : "s"}`;

  return (
    <div>
      <PageHeader
        title="Net Inventory"
        description={hasFilters ? `${netCount} matching your filters.` : `${netCount} across all categories and sites.`}
        actions={canRegister ? <RegisterNetDialog /> : undefined}
      />
      <Suspense>
        <NetsFilterBar />
      </Suspense>
      <NetsTable
        nets={nets}
        canManage={canRegister}
        canDelete={can(profile, "nets_delete")}
        canReactivate={can(profile, "reactivate")}
        canMarkFound={can(profile, "lost_found")}
      />
    </div>
  );
}
