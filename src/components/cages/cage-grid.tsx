import { CageCard } from "@/components/cages/cage-card";
import type { VCageCurrentState } from "@/lib/types/database";

export function CageGrid({ cages, siteSlug }: { cages: VCageCurrentState[]; siteSlug: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cages.map((cage) => (
        <CageCard key={cage.cage_id} cage={cage} siteSlug={siteSlug} />
      ))}
    </div>
  );
}
