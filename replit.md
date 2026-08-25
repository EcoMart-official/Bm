# Counterpart Commercial Billing

Counterpart is a mobile-first billing and inventory workspace for small businesses.

## Run & Operate

- `pnpm --filter @workspace/commercial-billing run dev` — run the React web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Supabase SQL: apply `supabase/migrations/202608230001_commercial_billing.sql` in the connected Supabase project's SQL editor
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Supabase Auth, PostgreSQL, RLS, and RPC
- Build: Vite

## Where things live

- `artifacts/commercial-billing/src/App.tsx` — routed application shell and page flows
- `artifacts/commercial-billing/src/lib/supabase.ts` — Supabase client, auth, and data service
- `artifacts/commercial-billing/src/lib/format.ts` — shared currency/date/error formatting
- `supabase/migrations/202608230001_commercial_billing.sql` — relational schema, RLS, onboarding, and transactional invoice RPC

## Architecture decisions

- Business records are isolated by `profiles.business_id` and shared RLS policies; browser queries never choose a business id.
- Onboarding and invoice creation use security-definer PostgreSQL functions so ownership, stock checks, stock deduction, invoice totals, and initial payment handling are server-enforced.
- The app uses the Supabase client directly; the existing API-server scaffold is not part of the billing app runtime.

## Product

The app includes Supabase auth, business onboarding, a dashboard, invoice entry, customer and product management, inventory fields, purchase and expense surfaces, reports/print actions, and workspace settings.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
