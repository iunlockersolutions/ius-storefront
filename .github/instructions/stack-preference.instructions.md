---
description: quick links for the stack we are building in this Next.js monolith.
applyTo: "**"
---

### LLM / Docs Index Files

- Next.js (general): https://nextjs.org/docs/llms-full.txt
- Better Auth (general): https://www.better-auth.com/llms.txt
- Drizzle ORM (full docs index): https://orm.drizzle.team/llms-full.txt
- shadcn/ui (general): https://ui.shadcn.com/llms.txt
- Vercel docs (full LLM index): https://vercel.com/docs/llms-full.txt
- Neon docs (LLM index): https://neon.com/llms.txt
- Resend (email): https://resend.com/docs/llms-full.txt
- TanStack Form docs: https://tanstack.com/form/latest
- TanStack Query docs: https://tanstack.com/query/latest
- TanStack Table: https://tanstack.com/table/latest
- TanStack devtools: https://tanstack.com/devtools/latest

### TanStack libraries

- TanStack Query retries (client/server behavior): https://tanstack.com/query/latest/docs/framework/react/guides/query-retries
- TanStack Table docs: https://tanstack.com/table/docs
- TanStack React Table adapter docs: https://tanstack.com/table/latest/docs/framework/react/react-table

### Forms (Decision: React Hook form)
- React Hook Form home: https://react-hook-form.com/
- React Hook Form LLM docs: not identified yet (no official `llms.txt` link recorded)
- Zod for form validation: https://zod.dev/

### Better Auth (Authentication)

- Better Auth installation: https://www.better-auth.com/docs/installation
- Better Auth Next.js integration: https://www.better-auth.com/docs/integrations/next
- Better Auth Drizzle adapter: https://www.better-auth.com/docs/adapters/drizzle
- Better Auth passkey plugin: https://www.better-auth.com/docs/plugins/passkey
- Better Auth 2FA plugin: https://www.better-auth.com/docs/plugins/2fa

### Drizzle ORM (Database / ORM)

- Drizzle docs home: https://orm.drizzle.team/
- Drizzle get started: https://orm.drizzle.team/docs/get-started
- Drizzle docs (LLM full index): https://orm.drizzle.team/llms-full.txt

### shadcn/ui (UI Components)

- shadcn/ui docs home: https://ui.shadcn.com/
- shadcn/ui docs LLM index: https://ui.shadcn.com/llms.txt

### Extra UI / UX Libraries (Optional)

- `react-easy-crop` docs: https://github.com/ValentinH/react-easy-crop
- `react-easy-crop` package: https://www.npmjs.com/package/react-easy-crop
- `boring-avatars` package: https://www.npmjs.com/package/boring-avatars
- `avvvatars-react` package: https://www.npmjs.com/package/avvvatars-react

- React Wheel Picker docs (canonical): https://react-wheel-picker.js.org/docs/getting-started
- React Wheel Picker docs (provided URL / MDX page): https://react-wheel-picker.chanhdai.com/docs/getting-started.mdx
- React Wheel Picker component examples (chanhdai site): https://chanhdai.com/components/react-wheel-picker
- React Wheel Picker package: https://www.npmjs.com/package/@ncdai/react-wheel-picker
- React Wheel Picker LLM docs: not identified yet (no official `llms.txt` link recorded)

- `qrcode` package (TOTP setup QR rendering): https://www.npmjs.com/package/qrcode

- mapcn docs home / introduction: https://mapcn.vercel.app/docs
- mapcn installation docs: https://mapcn.vercel.app/docs/installation
- mapcn API reference: https://mapcn.vercel.app/docs/api-reference
- mapcn maps catalog root (shadcn registry style): https://mapcn.vercel.app/
- mapcn LLM docs: not identified yet (no official `llms.txt` link recorded)

### Vercel (Deployment / Hosting / Storage)

- Vercel docs home: https://vercel.com/docs
- Vercel docs LLM full index: https://vercel.com/docs/llms-full.txt
- Vercel deployment docs: https://vercel.com/docs/deployments
- Vercel environment variables docs: https://vercel.com/docs/environment-variables
- Vercel Blob docs: https://vercel.com/docs/vercel-blob
- Vercel Blob SDK package (npm): https://www.npmjs.com/package/@vercel/blob

### Neon (Database Hosting - Postgres)

- Neon home: https://neon.com/
- Neon docs home: https://neon.com/docs
- Neon docs LLM index: https://neon.com/llms.txt
- Neon + Vercel integration docs (useful for deploy setup): https://neon.com/docs/guides/vercel
- Neon connection strings / connect docs: https://neon.com/docs/connect/connect-from-any-app

### Notes For This Project

- We are using Next.js as a monolith (frontend + backend in one app).
- Since this is primarily a dashboard product, default to a client-side-first approach for dashboard data flows.
- Use `TanStack Query` as the default client data layer for fetching, caching, retries, and invalidation on dashboard features.
- Use Drizzle only in server-side code.
- Use Better Auth with the Next.js integration https://www.better-auth.com/docs/integrations/next.
- Use React Hook Form for forms by default with Zod.
- Deploy on Vercel.
- Use Neon Postgres as the primary database.
- Use Vercel Blob for file storage/uploads.
