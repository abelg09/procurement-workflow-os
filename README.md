# Procurement Workflow OS

Internal procurement workflow application built with Next.js, TypeScript, Tailwind, and Supabase-ready data structures.

## Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
pnpm lint
pnpm build
```

## Local Preview Accounts

Use the active account selector in the header to validate each role workspace:

- Employee: Abel Gonsalves
- Mona
- Rashid
- Dr. Majed
- Amro
- Procure (`Procure@sulmi.ai`) for purchasing approvals and stages
- Finance (`finance@sulmi.ai`) for invoice approvals
- Admin

## Included

- Rebuilt procurement request form from the provided field list
- Google sign-in gate for Sulmi employee access, with employee-only request visibility
- Live Supabase workspace sync for shared requests, approvals, notifications, and audit history
- Admin-maintained project dropdown with Beta, Alpha, and Sira defaults
- CSV/Excel bulk item upload with template download, product links, and preview
- Live FX conversion to AED for threshold routing and reporting
- 5-stage workflow tracker
- AED 300 Rashid auto-approval rule based on converted AED total
- Role-specific approvals, declines, invoice upload, finance clearance, order confirmation, receipt, and closure
- Internal notification center and daily 3 PM Dubai email reminders
- Full audit trail
- Admin role/user editing, reassignment, CSV export, and Excel export with line-item reporting
- Procurement Assistant chatbot with deterministic procurement-data answers
- Supabase schema in `supabase/schema.sql`
- Admin system-readiness checks for database, authentication, and reminder deployment

## Supabase

Copy `.env.example` to `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=sulmi.ai
NEXT_PUBLIC_ADMIN_EMAILS=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
REMINDER_EMAIL_FROM=
REMINDER_EMAIL_OVERRIDES=
SLACK_BOT_TOKEN=
SLACK_WEBHOOK_URL=
SLACK_MENTION_OVERRIDES=
APP_BASE_URL=https://procurement.sulmi.ai/
PROCUREMENT_DASHBOARD_URL=
```

Apply `supabase/schema.sql` to a Supabase project. Enable Google as a Supabase Auth provider and add the production URL to the allowed redirect URLs. The public deployment is gated behind Google sign-in when Supabase client credentials are configured. The app syncs the shared procurement workspace through the `procurement_app_state` table, so requests and workflow actions persist across signed-in users. Set `NEXT_PUBLIC_ADMIN_EMAILS` to bootstrap the first admin account, then use Admin controls to assign Mona, Rashid, Dr. Majed, Amro, Procure, and Finance roles. Edlyn's personal account remains an Employee requester account and does not receive the Procure approval queue.

## Daily reminders

Daily reminder notifications run from `.github/workflows/daily-reminders.yml` at `11:00 UTC`, which is `3:00 PM Asia/Dubai`. Configure these repository secrets or variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, optional for email reminders
- `REMINDER_EMAIL_FROM`, optional for email reminders, for example `Procurement Workflow <procurement@sulmi.ai>`
- `PROCUREMENT_DASHBOARD_URL`, optional. Defaults to `https://procurement.sulmi.ai/`.
- `REMINDER_EMAIL_OVERRIDES`, optional comma-separated role or name mappings such as `Mona:mona@sulmi.ai,Rashid:rashid@sulmi.ai,Dr. Majed:dr.majed@sulmi.ai`
- `SLACK_BOT_TOKEN`, optional Slack bot token for direct Slack DM reminders and immediate approval alerts.
- `SLACK_WEBHOOK_URL`, optional incoming webhook URL for the Slack reminder channel.
- `SLACK_MENTION_OVERRIDES`, optional comma-separated role or name mappings such as `Mona:<@U012ABCDEF>,Rashid:<@U045ABCDEF>,Dr. Majed:<@U078ABCDEF>,Procure:<@U091ABCDEF>,Finance:<@U092ABCDEF>`
- `APP_BASE_URL`, optional. Defaults to `https://procurement.sulmi.ai/` and is used inside Slack/email open-request links.

The reminder job checks Mona, Rashid, Dr. Majed, Amro, Procure, and Finance. Email is sent when Resend settings are present. Slack sends direct messages when `SLACK_BOT_TOKEN` and each user's Slack user ID are configured in Admin. If no bot token is configured, Slack posts one channel digest when `SLACK_WEBHOOK_URL` is present, with optional user mentions from `SLACK_MENTION_OVERRIDES`.

## Immediate Slack and email alerts

Workflow actions create internal notifications plus outbound delivery records. After the shared Supabase state is saved, the browser calls the `procurement-notifications` Supabase Edge Function to deliver queued email and Slack alerts. Deploy the function and set these Supabase secrets:

```bash
supabase functions deploy procurement-notifications
supabase secrets set RESEND_API_KEY=... REMINDER_EMAIL_FROM="Procurement Workflow <procurement@sulmi.ai>"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set SLACK_BOT_TOKEN=xoxb-... APP_BASE_URL=https://procurement.sulmi.ai/
```

The repository also includes a manual `.github/workflows/supabase-functions.yml` workflow. Add `SUPABASE_ACCESS_TOKEN` as a GitHub secret and `SUPABASE_PROJECT_REF` as a GitHub variable or secret, then run **Deploy Supabase Functions** from GitHub Actions to deploy the function and sync the notification secrets.

Create a Slack app with the `chat:write` bot scope, install it to the Sulmi workspace, and add each approval user's Slack member ID in Admin under `Slack user ID`. Immediate Slack messages include the requester, item, AED amount, current stage, pending action, and an `Open request` button that opens the task inside the app.

## Custom domain

The production GitHub Pages deployment is configured for:

```bash
https://procurement.sulmi.ai/
```

Point the DNS `CNAME` record for the subdomain to `abelg09.github.io`, set the same custom domain in the repository Pages settings, and add the custom domain URL to Supabase Auth Site URL and Redirect URLs.

The Pages workflow sets `GITHUB_PAGES_CUSTOM_DOMAIN=procurement.sulmi.ai` by default so the static export serves from the domain root instead of `/procurement-workflow-os/`.
