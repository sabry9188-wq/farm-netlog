import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const TABLES = [
  "sites",
  "cages",
  "nets",
  "net_installations",
  "net_movements",
  "cleaning_records",
  "repair_records",
  "disposal_records",
  "lost_records",
  "profiles",
  "mesh_sizes",
  "net_conditions",
  "net_statuses",
  "removal_reasons",
  "repair_types",
  "disposal_reasons",
  "system_settings",
  "stock_thresholds",
  "audit_logs",
] as const;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Service-role client bypasses RLS entirely, so this can read every
  // table directly without needing a logged-in admin session.
  const results = await Promise.all(TABLES.map((table) => admin.from(table).select("*")));

  const backup: Record<string, unknown> = { exported_at: new Date().toISOString() };
  TABLES.forEach((table, i) => {
    const { data, error } = results[i];
    if (error) throw new Error(`Failed to export ${table}: ${error.message}`);
    backup[table] = data;
  });

  const dateLabel = new Date().toISOString().slice(0, 10);
  const filename = `netlog-backup-${dateLabel}.json`;
  const fileContent = JSON.stringify(backup, null, 2);
  const netCount = Array.isArray(backup.nets) ? backup.nets.length : 0;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const toEmail = process.env.BACKUP_EMAIL_TO ?? "sabry9188@gmail.com";

  const { error: emailError } = await resend.emails.send({
    from: "NetLog Backups <onboarding@resend.dev>",
    to: toEmail,
    subject: `NetLog weekly backup — ${dateLabel}`,
    text: `Attached is your automatic weekly NetLog backup (${netCount} nets, all cages, installations, and history) as of ${dateLabel}.\n\nKeep this file somewhere safe. It's a full snapshot of your farm's data.`,
    attachments: [{ filename, content: fileContent }],
  });

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: toEmail, netCount });
}
