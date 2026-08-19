import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getNets } from "@/lib/queries/nets";
import { getCurrentProfile, canCleanRepair } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { NetsFilterBar } from "@/components/nets/nets-filter-bar";
import { NetsTable } from "@/components/nets/nets-table";
import { RegisterNetDialog } from "@/components/nets/register-net-dialog";

export default async function TopNetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [nets, profile] = await Promise.all([
    getNets(supabase, { category: "TOP_NET", siteCode: sp.site, mesh: sp.mesh, status: sp.status, condition: sp.condition, q: sp.q }),
    getCurrentProfile(),
  ]);
  const canRegister = profile?.role === "admin" || profile?.role === "storekeeper";

  return (
    <div>
      <PageHeader
        title="Top / Bird Nets"
        description="Independent inventory and lifecycle tracking for top/bird nets — never combined with main net history."
        actions={canRegister ? <RegisterNetDialog defaultCategory="TOP_NET" /> : undefined}
      />
      <Suspense>
        <NetsFilterBar showCategory={false} />
      </Suspense>
      <NetsTable
        nets={nets}
        showCategory={false}
        canManage={canRegister}
        isAdmin={profile?.role === "admin"}
        canMarkFound={canCleanRepair(profile?.role)}
      />
    </div>
  );
}
