# Query Key Standards

This document defines query key conventions for TanStack Query in admin/dashboard flows.

## Source of Truth

- Key factory module: `lib/utils/query-keys.ts`
- Invalidation map: `lib/utils/query-invalidation-map.ts`

## Key Naming Conventions

- Use top-level namespace `admin` for backoffice queries.
- Use domain segment next (`products`, `orders`, `payments`, etc.).
- Use params object as final segment for list/filter queries.
- Use explicit id segment for detail queries.

Examples:

- `queryKeys.admin.products({ page, limit, search, status })`
- `queryKeys.admin.order(orderId)`
- `queryKeys.admin.paymentStats()`

## Domain Coverage

Current admin domains covered by query keys:

- products
- categories
- inventory
- orders
- payments
- reviews
- customers
- reports
- settings
- profile
- staff users

## Invalidation Rules

- Mutations must use `invalidateMutationCaches(queryClient, mutationKey, context)`.
- Add or update mappings in `getInvalidationTargets(...)` when introducing a new mutation.
- Prefer targeted invalidation (detail + list keys) when context identifiers are available.

## Additions Checklist

When adding a new query or mutation:

1. Add key factory in `query-keys.ts`.
2. Add hook using that key factory.
3. Add mutation key and invalidation targets in `query-invalidation-map.ts`.
4. Ensure API route + response envelope follows admin API contracts.
