<!-- Copilot / AI agent instructions for contributors and coding agents -->
# IUS Storefront — AI coding agent quick guide

This file captures essential, repository-specific knowledge to help AI agents be productive immediately.

## Purpose
- Focus: storefront + admin Next.js app using the App Router (app/). Key domains: products, orders, inventory, payments, users.
- Primary concerns: server components for routing/layouts, client components for interactivity, RBAC-backed auth, Postgres via Drizzle ORM, and Vercel storage for images.

## Quick start (commands)
- Dev: `pnpm dev` or `npm run dev` (runs `next dev`).
- Build: `npm run build` → `npm run start` for prod server.
- Lint: `npm run lint` / fix: `npm run lint:fix`.
- DB: migrations & tools use `drizzle-kit`:
  - `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`
  - Seed / clean: `npm run db:seed`, `npm run db:clean` (runs `tsx lib/db/...`)

## High-level architecture notes
- Next.js App Router (see `app/`): layouts are used heavily. Example: `app/(storefront)/layout.tsx` is a server component that calls `getServerSession()`.
- Route grouping: store and admin use separate route groups under `app/(storefront)/` and `app/admin/`.
- Components: UI primitives live in `components/ui/` (shadcn-style). Feature UIs split into `components/storefront/` and `components/admin/`.
- State: React Query is the canonical client-state library. App-level provider is in `components/providers.tsx`.
- Auth & RBAC: user sessions and permissions live in `lib/auth*`:
  - Client auth utilities: `lib/auth-client.ts` (uses `better-auth` + passkeys)
  - Server RBAC helpers & session access: `lib/auth/rbac.ts` (functions like `getServerSession()`, `requireRole()`)
- Data layer: `drizzle-orm` + `postgres`. DB schema lives under `lib/db/schema` and migrations managed by `drizzle-kit`.
- Storage & integrations: Vercel Blob (`@vercel/blob`) for image uploads; `next.config.ts` contains remote image patterns (see `remotePatterns`).

## Project-specific conventions and patterns
- Server vs Client components
  - Default: prefer server components for layouts and data fetching (e.g., `app/(storefront)/layout.tsx` is `async` and calls server helpers).
  - Client components must include `"use client"` (see `components/providers.tsx`). Interactive pieces and hooks live here.
- Session access pattern
  - Use `getServerSession()` exported from `lib/auth/rbac.ts` inside server components and layouts to determine UI state (header, footer).
  - Client-side hooks are exposed from `lib/auth-client.ts` (e.g., `useSession`, `signIn`, `signOut`).
- RBAC permissions
  - Permissions are strings and grouped in `ROLE_PERMISSIONS` inside `lib/auth/rbac.ts`. Use `requirePermission()`/`requireRole()` in API routes or server actions.
- Database usage
  - Use `db` from `lib/db` and Drizzle query APIs; see `lib/auth/rbac.ts` for example `db.select(...).from(...).where(...)` joins.
- UI pattern
  - Reusable atoms under `components/ui/*`; feature components import these instead of raw HTML/CSS.

## Integration & external dependencies to be aware of
- Auth: `better-auth` + `@better-auth/passkey` for passkey flows; admin plugin uses `ac` and `roles` from local RBAC.
- Email: `resend` is included (check `lib/email`).
- Image hosting: Vercel Blob + `next/image` with remote patterns in `next.config.ts`.
- DB: `postgres` package + `drizzle-orm` + `drizzle-kit` for migrations and studio.

## Files to inspect for common patterns (examples)
- Layout + global providers: `app/layout.tsx`, `components/providers.tsx`
- Storefront layout & session usage: `app/(storefront)/layout.tsx` (calls `getServerSession()`)
- RBAC & server session helpers: `lib/auth/rbac.ts` (permission enums, `requireRole()`)
- Client auth utilities: `lib/auth-client.ts`
- DB seed scripts: `lib/db/seed.ts` (invoked by `npm run db:seed`)
- Example component patterns: `components/storefront/header.tsx`, `components/ui/button.tsx`

## When editing code, prefer these safe edits
- If altering server-session flow, update both `lib/auth/rbac.ts` and `lib/auth-client.ts` to keep server/client APIs consistent.
- When adding data fetching on server components, prefer `async` server components over client hooks for SSR performance.

## What this file does NOT cover
- CI / deployment specifics (project deploys to Vercel but infra-specific env vars are not included here).
- Untracked runtime secrets — consult `.env` and `lib/env.ts` when present.

---
If any section looks unclear or you'd like more examples (API route patterns, a typical admin flow, or DB schema examples), tell me which area to expand and I'll iterate.

---
Read the following llms.txt file for more general instructions on how to write instructions files for AI agents:
- https://www.better-auth.com/llms.txt
- https://orm.drizzle.team/llms-full.txt
- https://ui.shadcn.com/llms.txt
- https://nextjs.org/docs/llms-full.txt
- https://resend.com/docs/llms-full.txt

