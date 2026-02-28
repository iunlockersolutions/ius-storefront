# Copilot Instructions for ius-storefront

## Instruction compatibility notes
- This repo currently uses top-level folders (`app/`, `components/`, `lib/`, `docs/`), not `src/*`; apply feature-first placement by scope, but keep current folder layout unless a migration is requested.
- The imported instruction files in `.github/instructions/*` are mostly compatible; treat `src/features/*` as a target architecture, not a hard requirement for current edits.

## Big picture architecture
- This is a Next.js 16 App Router monolith with two product surfaces: public storefront under `app/(storefront)` and backoffice under `app/admin`.
- Prefer Server Components for data pages; client interactivity lives in leaf components under `components/**` with `'use client'`.
- Core business logic is centralized in server actions under `lib/actions/*` (products, checkout, payments, inventory, customers, etc.).
- Persistence uses Drizzle + Postgres (`lib/db/index.ts`, `lib/db/schema/*`), with domain tables split by concern (catalog, inventory, orders, payments, reviews, auth).
- Auth is Better Auth + passkeys + social providers (`lib/auth.ts`, `lib/auth-client.ts`), with role/permission helpers in `lib/auth/rbac.ts`.

## Route and security boundaries
- Admin access is enforced in layers:
  1) edge proxy masking/redirect rules in `proxy.ts`,
  2) server layout checks in `app/admin/layout.tsx` (`getServerSession`, `isStaff`),
  3) action-level guards via `requireStaff`, `requireRole`, `requirePermission` from `lib/auth/rbac.ts`.
- Do not rely only on client-side checks for admin/staff features.
- Auth endpoints are mounted via Better Auth catch-all route: `app/api/auth/[...all]/route.ts`.

## Data flow patterns to follow
- Read/write operations should go through `lib/actions/*`; pages/components call actions, not ad-hoc DB logic.
- For dashboard-heavy interactivity, prefer client-side data flow with TanStack Query and route handlers/actions as the server boundary.
- Complex writes use Drizzle transactions and row locks (see `lib/actions/checkout.ts` and payment webhook handling).
- Inventory consistency is maintained through `inventory_items` + append-style `inventory_movements`; update both when stock state changes.
- Payment flow: create payment session in `lib/actions/payment.ts`, confirm via `app/api/payment/webhook/route.ts`, then update order + inventory atomically.
- Cache invalidation is explicit after mutations using `revalidatePath` and tag helpers in `lib/utils/cache.ts`.

## File placement rules (current repo)
- Route-only UI/action files should be colocated under route-private folders like `app/**/_components` and `app/**/_actions`.
- Reusable domain logic belongs in `lib/actions/*` and related domain modules under `lib/*`.
- Cross-route shared UI belongs in `components/*`; shared primitives stay in `components/ui/*`.
- Shared utilities/integrations belong in `lib/utils` and `lib/*`; avoid putting business logic directly in route files.

## Next.js 16 conventions used here
- Dynamic route props are async; await `params`/`searchParams` in pages and metadata (example: `app/(storefront)/products/[slug]/page.tsx`).
- App-wide providers are mounted in `app/layout.tsx` (`components/providers.tsx` for React Query + tooltip context, `Toaster` for notifications).
- Use `next/image` with configured remote hosts in `next.config.ts` (Vercel Blob + Unsplash patterns).

## UI and code style conventions
- Use existing shadcn-style components from `components/ui/*`; do not import `@base-ui/react` or `radix-ui` directly outside UI primitives (enforced by ESLint).
- Follow import sort groups and no-semicolon style from `eslint.config.mjs`.
- Use absolute imports via `@/*` path alias from `tsconfig.json`.
- Keep types explicit for action inputs/outputs and validate external/form data with Zod (see `lib/env.ts`, action schemas in `lib/actions/*`).

## Developer workflows (actual project commands)
- Install deps: `pnpm install`
- Dev server: `pnpm dev` (runs on port `4000`)
- Build/start: `pnpm build` then `pnpm start`
- Lint: `pnpm lint` (or `pnpm lint:fix`)
- DB lifecycle: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`
- Seed/reset seed data: `pnpm db:seed`, `pnpm db:clean`
- Local payment gateway simulator: `node scripts/mock-ipg.js` (default port `3001`)

## Documentation-first workflow
- Review relevant official docs from `.github/instructions/stack-preference.instructions.md` before implementing unfamiliar stack areas (Next.js, Better Auth, Drizzle, shadcn/ui, TanStack).
- Keep `docs/` updated when major implementation decisions or architectural patterns change.

## Integration details agents should not miss
- Environment variables are runtime-validated with Zod in `lib/env.ts`; invalid env fails fast.
- Upload API (`app/api/upload/route.ts`) requires authenticated admin/manager role and stores assets in Vercel Blob.
- Custom auth-related cookies (`is-staff`, `must-change-password`) use secure-prefix helpers in `lib/utils/cookies.ts`; keep naming consistent.
- Keep UUID IDs for database entities; Better Auth is configured with `advanced.database.generateId: "uuid"` in `lib/auth.ts`.
- There is currently no test script/test suite in `package.json`; prioritize lint/build checks for validation.
