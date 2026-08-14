import type { ReportColumn } from "@/lib/queries/reports";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv(columns: ReportColumn[], rows: Row[], filename: string) {
  const escape = (value: unknown) => {
    const s = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c.key])).join(",")).join("\n");
  const csv = `${header}\n${body}`;
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export async function exportPdf(title: string, columns: ReportColumn[], rows: Row[], filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`NetLog · Generated ${new Date().toLocaleString()}`, 14, 22);

  autoTable(doc, {
    startY: 27,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 58, 102] },
    alternateRowStyles: { fillColor: [244, 247, 251] },
  });

  doc.save(filename);
}
