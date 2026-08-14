import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { siteSlug } from "@/lib/constants";

export default async function CagesOverviewPage() {
  const supabase = await createClient();
  const { bySite } = await getDashboardData(supabase);

  return (
    <div>
      <PageHeader title="Cage Farms" description="Select a site to view its cage map." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.values(bySite).map(({ site, cageCount, installed, inStore, overdue }) => (
          <Link
            key={site.id}
            href={`/cages/${siteSlug(site.site_code)}`}
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-6" />
              </div>
              <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-foreground">{site.site_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {cageCount} cages · Ø {site.cage_diameter_m}m × {site.cage_depth_m}m
              </p>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <span>
                <span className="font-mono font-bold text-status-blue">{installed}</span>{" "}
                <span className="text-muted-foreground">installed</span>
              </span>
              <span>
                <span className="font-mono font-bold text-status-green">{inStore}</span>{" "}
                <span className="text-muted-foreground">in store</span>
              </span>
              {overdue > 0 && (
                <span>
                  <span className="font-mono font-bold text-status-red">{overdue}</span>{" "}
                  <span className="text-muted-foreground">overdue</span>
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
