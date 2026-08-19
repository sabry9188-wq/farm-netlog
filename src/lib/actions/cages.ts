"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, canEditCageInfo } from "@/lib/auth";

type ActionResult<T = unknown> = { data?: T; error?: string };

export async function updateCageInfoAction(input: {
  cageId: string;
  species: string | null;
  avgFishWeightG: number | null;
  stockingDate: string | null;
  productionStage: string | null;
  path: string;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!canEditCageInfo(profile?.role)) {
    return { error: "You don't have permission to edit cage information." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cages")
    .update({
      species: input.species,
      avg_fish_weight_g: input.avgFishWeightG,
      stocking_date: input.stockingDate,
      production_stage: input.productionStage,
    })
    .eq("id", input.cageId);

  if (error) return { error: error.message };

  revalidatePath(input.path);
  revalidatePath("/cages", "layout");
  return {};
}
