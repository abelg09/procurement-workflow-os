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
- Edlyn
- Aileen
- Admin

## Included

- Rebuilt procurement request form from the provided field list
- Google sign-in gate for Sulmi employee access, with employee-only request visibility
- Live Supabase workspace sync for shared requests, approvals, notifications, and audit history
- Admin-maintained project dropdown with Beta, Alpha, and Sira defaults
- CSV/Excel bulk item upload with template download and preview
- Live FX conversion to AED for threshold routing and reporting
- 5-stage workflow tracker
- AED 300 Rashid auto-approval rule based on converted AED total
- Role-specific approvals, declines, invoice upload, finance clearance, order confirmation, receipt, and closure
- Internal notification center and 3 PM reminder simulation
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
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=sulmi.com
NEXT_PUBLIC_ADMIN_EMAILS=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply `supabase/schema.sql` to a Supabase project. Enable Google as a Supabase Auth provider and add the GitHub Pages URL to the allowed redirect URLs. The public GitHub Pages deployment is gated behind Google sign-in when Supabase client credentials are configured. The app syncs the shared procurement workspace through the `procurement_app_state` table, so requests and workflow actions persist across signed-in users. Set `NEXT_PUBLIC_ADMIN_EMAILS` to bootstrap the first admin account, then use Admin controls to assign Mona, Rashid, Dr. Majed, Edlyn, and Aileen roles.
