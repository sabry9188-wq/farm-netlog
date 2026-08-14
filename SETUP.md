# NetLog — Setup Guide

This is a step-by-step walkthrough for getting NetLog running: Supabase (database + auth), the app locally, and deployment to Vercel. Follow it in order — later steps depend on earlier ones.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**. Choose an organization, name it (e.g. `netlog`), set a database password (save it somewhere safe), pick a region close to the farm, and create it.
3. Wait for the project to finish provisioning (~2 minutes).

## 2. Run the database migrations

The SQL that creates every table, function, view, security policy, and the starting data lives in `supabase/migrations/`. Run each file **in order** in the Supabase SQL editor.

1. In the Supabase dashboard, open **SQL Editor** (left sidebar) → **New query**.
2. Open each file below from this project folder, paste its full contents into the SQL editor, and click **Run**. Do them one at a time, in this exact order:

   | # | File | What it creates |
   |---|------|------------------|
   | 1 | `supabase/migrations/0001_schema.sql` | All tables, enums, indexes |
   | 2 | `supabase/migrations/0002_functions.sql` | Net ID generation + the install/remove/clean/repair/dispose/lose workflow functions |
   | 3 | `supabase/migrations/0003_views.sql` | Dashboard/report views (alert status, cage state, stock summary, low stock, lifecycle stats) |
   | 4 | `supabase/migrations/0004_rls.sql` | Row Level Security policies + the "auto-create profile on sign-up" trigger |
   | 5 | `supabase/migrations/0005_seed_lookups.sql` | The 2 sites, 44 cages, mesh sizes, conditions, statuses, reasons, and default settings |
   | 6 | `supabase/migrations/0006_seed_demo_data.sql` | Sample nets so the dashboard/reports aren't empty on first login (see §8 to remove later) |

   If a file errors partway through, fix the reported issue and re-run just that file — files 1–5 use `on conflict ... do nothing` / are safe to re-run. File 6 is not idempotent (running it twice creates duplicate demo nets) — only run it once.

## 3. Configure authentication

NetLog has **no public sign-up page** — accounts are created by an Admin from the Users page (or by you, for the very first account). This is a deliberate choice for a controlled farm operation.

1. In Supabase, go to **Authentication → Providers** and confirm **Email** is enabled (it is by default).
2. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: `http://localhost:3000` for now (you'll update this to your production URL after deploying — see §7).
   - **Redirect URLs**: add `http://localhost:3000/**` (and later your production domain).
3. Supabase's built-in email sending works out of the box for testing but is rate-limited. Before relying on this for real farm staff, go to **Authentication → Emails → SMTP Settings** and connect a real SMTP provider (Resend, SendGrid, Postmark, etc.) so invite emails land reliably.

## 4. Get your API keys

In Supabase, go to **Project Settings → API**. You'll need three values:

- **Project URL**
- **anon / public key**
- **service_role key** (click "Reveal" — keep this secret, it bypasses Row Level Security)

## 5. Configure the app locally

1. Open a terminal in the project folder.
2. Copy the example env file and fill in the three values from step 4:

   ```
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Install dependencies and start the dev server:

   ```
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) — it should redirect you to `/login`.

## 6. Create your first Admin account

Since there's no public sign-up, bootstrap the first account manually:

1. In Supabase, go to **Authentication → Users → Add user → Create new user**. Enter your email and a password (check "Auto Confirm User" so you can log in immediately).
2. This automatically creates a matching row in `profiles` with role `viewer` (via the trigger from migration 0004).
3. Promote yourself to Admin — run this once in the SQL Editor (replace the email):

   ```sql
   update profiles set role = 'admin' where email = 'you@yourfarm.com';
   ```

4. Log in at `/login` with that email/password. You now have full Admin access, including the **Users** page to invite everyone else properly (Storekeeper, Farm Supervisor, Viewer accounts) — from there on, invited users get an email to set their own password.

## 7. Push the code to GitHub

If Claude Code hasn't already pushed this for you, from the project folder:

```
git init
git add .
git commit -m "Initial NetLog build"
git branch -M main
git remote add origin https://github.com/sabry9188-wq/farm-netlog.git
git push -u origin main
```

## 8. Remove the demo data (whenever you're ready to go live)

Every demo row is tagged `is_demo = true`. Run this once in the SQL Editor to remove it cleanly (order matters, due to foreign keys):

```sql
update cages set current_main_net_id = null where current_main_net_id in (select id from nets where is_demo = true);
update cages set current_guard_net_id = null where current_guard_net_id in (select id from nets where is_demo = true);
update cages set current_top_net_id = null where current_top_net_id in (select id from nets where is_demo = true);
delete from net_movements where net_id in (select id from nets where is_demo = true);
delete from net_installations where net_id in (select id from nets where is_demo = true);
delete from cleaning_records where net_id in (select id from nets where is_demo = true);
delete from repair_records where net_id in (select id from nets where is_demo = true);
delete from disposal_records where net_id in (select id from nets where is_demo = true);
delete from lost_records where net_id in (select id from nets where is_demo = true);
delete from audit_logs where entity_type = 'nets' and entity_id in (select id::text from nets where is_demo = true);
delete from nets where is_demo = true;
```

The 2 sites and 44 real cages are **not** demo data — they stay.

## 9. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com), sign in, click **Add New → Project**, and import `sabry9188-wq/farm-netlog` from GitHub.
2. In the import screen, add the same three environment variables from step 4/5 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Click **Deploy**.
4. Once deployed, copy your production URL (e.g. `https://farm-netlog.vercel.app`).
5. Back in Supabase → **Authentication → URL Configuration**, update **Site URL** to that production URL and add `https://farm-netlog.vercel.app/**` to **Redirect URLs**. This is required for invite/password-reset emails to link back to the right place.
6. Every future `git push` to `main` automatically redeploys.

## 10. Day-to-day roles

| Role | Can do |
|---|---|
| **Admin / Manager** | Everything: manage nets/cages, approve disposal, manage users, edit Settings, view Audit Log |
| **Storekeeper** | Register/receive/issue nets, record cleaning & repair, view reports — can approve disposal only if an Admin flips "Can approve disposal" on their account in Users |
| **Farm Supervisor** | Install/remove nets, record cage info, view history |
| **Viewer** | Read-only |

## 11. What's next / known limitations

- **QR codes**: intentionally left out of this build (per your earlier choice) — the schema already has a stable `net_code` on every net, so QR generation/scanning can be added later without a schema change.
- **Email delivery**: relies on Supabase Auth's built-in email sender until you connect SMTP (§3) — fine for testing, not for relying on at scale.
- **Middleware deprecation warning**: you may see `The "middleware" file convention is deprecated. Please use "proxy" instead` when running the dev server — this is just a Next.js 16 naming heads-up, the app works correctly either way.

---

If anything in the SQL editor errors, copy the exact error message back to Claude Code — the migration files are plain SQL and easy to patch.
