import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteByCode, getCagesForSite } from "@/lib/queries/cages";
import { PageHeader } from "@/components/shared/page-header";
import { CageGrid } from "@/components/cages/cage-grid";
import { SITE_CODES_BY_SLUG } from "@/lib/constants";

export default async function SiteCageMapPage({ params }: { params: Promise<{ site: string }> }) {
  const { site: siteSlugParam } = await params;
  const siteCode = SITE_CODES_BY_SLUG[siteSlugParam];
  if (!siteCode) notFound();

  const supabase = await createClient();
  const site = await getSiteByCode(supabase, siteCode);
  if (!site) notFound();

  const cages = await getCagesForSite(supabase, site.id);

  return (
    <div>
      <PageHeader
        title={site.site_name}
        description={`${cages.length} cages · Ø ${site.cage_diameter_m}m × ${site.cage_depth_m}m depth`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-xs">
        <LegendDot color="bg-status-green" label="Net OK (>14 days)" />
        <LegendDot color="bg-status-yellow" label="Change approaching (≤14 days)" />
        <LegendDot color="bg-status-orange" label="Change required soon (≤7 days)" />
        <LegendDot color="bg-status-red" label="Overdue" />
        <LegendDot color="bg-status-grey" label="No net assigned" />
      </div>

      <CageGrid cages={cages} siteSlug={siteSlugParam} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
