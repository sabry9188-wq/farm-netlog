import Link from "next/link";
import { FileBarChart, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { REPORTS } from "@/lib/queries/reports";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Every report exports to CSV or PDF." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileBarChart className="size-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
              Open report <ArrowRight className="size-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
