"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportCsv, exportPdf } from "@/lib/export";
import type { ReportColumn } from "@/lib/queries/reports";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export function ReportView({ title, columns, rows }: { title: string; columns: ReportColumn[]; rows: Row[] }) {
  const [busy, setBusy] = useState(false);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(columns, rows, `${slug}.csv`)}>
            <FileSpreadsheet className="size-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await exportPdf(title, columns, rows, `${slug}.pdf`);
              } finally {
                setBusy(false);
              }
            }}
          >
            <FileDown className="size-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">No records.</TableCell>
              </TableRow>
            )}
            {rows.map((r, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key}>{r[c.key] ?? "—"}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
