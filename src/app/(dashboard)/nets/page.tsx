import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getNets } from "@/lib/queries/nets";
import { getCurrentProfile } from "@/lib/auth";
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

  const canRegister = profile?.role === "admin" || profile?.role === "storekeeper";

  return (
    <div>
      <PageHeader
        title="Net Inventory"
        description={`${nets.length} net${nets.length === 1 ? "" : "s"} across all categories and sites.`}
        actions={canRegister ? <RegisterNetDialog /> : undefined}
      />
      <Suspense>
        <NetsFilterBar />
      </Suspense>
      <NetsTable nets={nets} />
    </div>
  );
}
