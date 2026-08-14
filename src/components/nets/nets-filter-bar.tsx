"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/constants";

const STATUSES = [
  "Available in Store",
  "Installed in Cage",
  "Sent for Cleaning",
  "Under Cleaning",
  "Ready for Use",
  "Under Repair",
  "Ready After Repair",
  "Reserved",
  "Lost",
  "Damaged",
  "Beyond Repair",
  "Disposed",
];

const CONDITIONS = ["New", "Excellent", "Good", "Fair", "Poor", "Damaged", "Requires Repair", "Beyond Repair"];

export function NetsFilterBar({ showCategory = true }: { showCategory?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams],
  );

  const hasFilters = ["site", "category", "mesh", "status", "condition", "q"].some((k) => searchParams.get(k));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search Net ID…"
          defaultValue={searchParams.get("q") ?? ""}
          className="pl-9"
          onChange={(e) => setParam("q", e.target.value || undefined)}
        />
      </div>

      <Select value={searchParams.get("site") ?? "all"} onValueChange={(v) => setParam("site", v === "all" ? undefined : v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Site" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sites</SelectItem>
          <SelectItem value="ST05">Station-05</SelectItem>
          <SelectItem value="OFFS">Offshore</SelectItem>
        </SelectContent>
      </Select>

      {showCategory && (
        <Select value={searchParams.get("category") ?? "all"} onValueChange={(v) => setParam("category", v === "all" ? undefined : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("condition") ?? "all"} onValueChange={(v) => setParam("condition", v === "all" ? undefined : v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Condition" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Conditions</SelectItem>
          {CONDITIONS.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Mesh e.g. 10 mm"
        defaultValue={searchParams.get("mesh") ?? ""}
        className="w-36"
        onChange={(e) => setParam("mesh", e.target.value || undefined)}
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="size-4" /> Clear
        </Button>
      )}
    </div>
  );
}
