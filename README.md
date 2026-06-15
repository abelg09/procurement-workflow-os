# Procurement Workflow OS

Internal procurement workflow MVP built with Next.js, TypeScript, Tailwind, and Supabase-ready data structures.

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

## Demo Roles

Use the role switcher in the header to act as:

- Employee: Layla Hassan
- Mona
- Rashid
- Dr. Masjid
- Edlyn
- Aileen
- Admin

## Included

- Rebuilt procurement request form from the provided field list
- 5-stage workflow tracker
- AED 300 Rashid auto-approval rule
- Role-specific approvals, declines, invoice upload, finance clearance, order confirmation, receipt, and closure
- Internal notification center and 3 PM reminder simulation
- Full audit trail
- Admin role/user editing, reassignment, CSV export, and Excel export
- Procurement Assistant chatbot with deterministic database-backed answers
- Supabase schema in `supabase/schema.sql`

## Supabase

Copy `.env.example` to `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply `supabase/schema.sql` to a Supabase project. The current MVP runs immediately with seeded local demo data and localStorage persistence until real Supabase credentials are connected.
