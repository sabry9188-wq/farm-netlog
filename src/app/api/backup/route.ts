import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return NextResponse.json({ stage: "auth.getUser", error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError) {
      return NextResponse.json({ stage: "load profile", error: profileError.message }, { status: 500 });
    }
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Only Admin can download a backup" }, { status: 403 });
    }

    const { data, error } = await supabase.rpc("fn_export_backup");
    if (error) {
      return NextResponse.json({ stage: "fn_export_backup", error: error.message }, { status: 500 });
    }

    const filename = `netlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { stage: "unhandled", error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
