# Data Flow Architecture

This document defines the current data flow model for the monolith.

## Scope Split

- Admin and backoffice routes (`app/admin`) are client-interactive by default.
- Storefront routes (`app/(storefront)`) are server-rendered by default.

## Admin Data Flow (Default)

1. Page shell renders and mounts a client component.
2. Client component uses TanStack Query hooks from `hooks/admin/*`.
3. Hook calls an admin API route under `app/api/admin/*`.
4. API route enforces permission checks and validates request input.
5. API route delegates domain logic to `lib/actions/*`.
6. Domain action executes server-side business logic and Drizzle queries.
7. Route returns normalized envelope via `ok(...)` or `fail(...)`.
8. Mutation hooks trigger cache invalidation via `invalidateMutationCaches(...)`.

## Storefront Data Flow (Default)

1. Route Server Components fetch data server-side through `lib/actions/*`.
2. Data is rendered directly in server output.
3. Client-side fetching is used only for clearly interactive islands.

## Mutation and Consistency Rules

- Clients do not call Drizzle directly.
- Privileged writes go through API routes and/or guarded server actions.
- Mutations invalidate domain query keys instead of relying on full-page reload.
- API routes use standardized error mapping (`mapErrorToApi`) and error codes.

## Response Contract

- Success shape: `{ success: true, data }`
- Error shape: `{ success: false, error: { code, message, details? } }`
- Source of truth: `lib/utils/api-response.ts`
