# Migration Decisions Log

Last updated: 2026-02-28

This log records major architecture decisions made during the admin refactor rollout.

## 2026-02-28 — Admin Data Layer Standardization

### Decision

Standardize interactive admin flows on TanStack Query hooks backed by admin API routes, with server-only business logic in `lib/actions/*`.

### Why

- Make client interactivity consistent across domains.
- Reduce direct server-action coupling in large admin client components.
- Centralize authorization, validation, and error contracts at API boundaries.

### Domain Rollout Status

- Users / Roles: migrated to admin query + mutation hooks.
- Products / Categories: migrated to admin API + query/mutation hooks.
- Inventory: migrated to inventory query/mutation hooks.
- Orders / Payments: migrated list/detail/mutation and verification queue flows.
- Reviews: migrated moderation queue and management flows.
- Customers: migrated list/detail and role operations.
- Reports: migrated to client query-backed analytics load.
- Settings / Profile: migrated profile/settings/session mutations.

### Guardrails Added

- Unified API envelope and error taxonomy (`lib/utils/api-response.ts`).
- Centralized admin API permission + audit wrapper (`lib/auth/admin-api.ts`).
- UUID schema governance audit (`scripts/audit-schema-uuid.ts`).
- Touch-first remediation for critical admin table interactions.
