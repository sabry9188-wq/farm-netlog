import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { REPORTS, getReportData } from "@/lib/queries/reports";
import { PageHeader } from "@/components/shared/page-header";
import { ReportView } from "@/components/reports/report-view";

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const def = REPORTS.find((r) => r.id === reportId);
  if (!def) notFound();

  const supabase = await createClient();
  const { columns, rows } = await getReportData(supabase, reportId);

  return (
    <div>
      <Link href="/reports" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Reports
      </Link>
      <PageHeader title={def.title} description={def.description} />
      <ReportView title={def.title} columns={columns} rows={rows} />
    </div>
  );
}
