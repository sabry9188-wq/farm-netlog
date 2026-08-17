import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets and /api/cron/* (which is triggered by
    // Vercel's scheduler with no browser session — it checks its own bearer
    // secret instead, and must never be redirected to /login). Other API
    // routes, like /api/backup, still go through this middleware so their
    // Supabase session cookies stay refreshed.
    "/((?!_next/static|_next/image|favicon.ico|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
