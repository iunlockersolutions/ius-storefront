# Full Codebase Refactor TODO (Instruction Compliance)

Last updated: 2026-02-28

This is the execution backlog for achieving strict compliance with repository instruction files.

## Milestone A — Governance and Guardrails

- [x] Create compliance baseline matrix (`docs/architecture/compliance-matrix.md`)
- [ ] Add PR checklist for instruction compliance
- [ ] Add architecture decision log template in `docs/architecture/`
- [ ] Add source-only audit conventions (exclude `.next`, build outputs) to docs

## Milestone B — API Boundary Foundation (Phase 1)

- [x] Create shared API response envelope helpers
- [x] Create first admin read endpoint: `GET /api/admin/products`
- [x] Create first admin read endpoint: `GET /api/admin/users/staff`
- [x] Add products mutation endpoints (`POST /api/admin/products`, `PATCH/DELETE /api/admin/products/:id`, `PUT /api/admin/products/:id/images`)
- [x] Add admin route handlers for categories domain
- [x] Add admin route handlers for inventory domain
- [x] Add admin route handlers for orders domain
- [x] Add admin route handlers for payments domain
- [x] Add admin route handlers for reviews domain
- [x] Add admin route handlers for customers domain
- [x] Add admin route handlers for reports domain
- [x] Add admin route handlers for settings domain
- [x] Standardize API error code taxonomy (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`)

## Milestone C — TanStack Query Adoption (Phase 2)

- [x] Add domain query key factories (`products`, `users`, `orders`, etc.)
- [x] Create `useAdminProductsQuery` and `useAdminProductsMutation` hooks
- [x] Create `useStaffUsersQuery` and staff mutation hooks
- [x] Create initial read hooks (`useAdminProductsQuery`, `useStaffUsersQuery`)
- [x] Create initial products mutation hooks (create/update/delete/images)
- [x] Create initial categories query/mutation hooks
- [x] Create initial inventory query/mutation hooks
- [x] Create initial orders/payments query/mutation hooks
- [x] Add retry policy by operation type (reads vs writes)
- [x] Add cache invalidation map per mutation
- [x] Add consistent pending/error/success UI states for admin clients

## Milestone D — Admin Flow Migration (Phase 3)

- [x] Migrate products list page/client to query hooks
- [x] Migrate users/staff list page/client to query hooks
- [x] Migrate categories management to query hooks
- [x] Migrate inventory adjustments/history to query hooks
- [x] Migrate orders list/detail updates to query hooks
- [x] Migrate payments verification queue to query hooks
- [x] Migrate reviews moderation flows to query hooks
- [x] Migrate customers list/detail role operations to query hooks
- [x] Migrate reports analytics page/client to query hooks
- [x] Migrate settings/profile mutations to query hooks

## Milestone E — Route Layer Cleanup (Phase 4)

- [x] Remove direct `db` imports from route pages
- [x] Move route-local UI to `app/**/_components` where appropriate
- [x] Introduce `app/**/_actions` only for route-specific wrappers
- [x] Keep business logic in `lib/actions/*` or API handlers

## Milestone F — Security + RBAC Hardening (Phase 5)

- [x] Ensure all admin API handlers enforce `requireStaff` / permission checks
- [x] Add structured activity logging coverage for all privileged mutations
- [x] Verify each destructive operation has role + resource checks
- [x] Add security review checklist for new admin endpoints

## Milestone G — UUID and Schema Governance (Phase 6)

- [x] Add schema lint/audit script for UUID primary key enforcement
- [x] Add check for UUID foreign key consistency where relationally applicable
- [x] Document exception policy for polymorphic IDs (e.g., audit `entityId`)

## Milestone H — Touch-First UX Remediation (Phase 7)

- [x] Replace hover-only interactions on critical admin controls
- [x] Increase tap targets for icon-only controls on mobile
- [x] Ensure destructive actions are reachable with touch-first patterns
- [x] Validate table interactions on small breakpoints

## Milestone I — Documentation Alignment (Phase 8)

- [x] Create `docs/architecture/data-flow.md`
- [x] Create `docs/architecture/admin-api-contracts.md`
- [x] Create `docs/architecture/query-key-standards.md`
- [x] Create `docs/architecture/rbac-boundaries.md`
- [x] Update docs with migration decisions as each domain is completed

## Milestone J — Tooling and CI Guardrails (Phase 9)

- [x] Add lint rule/check to prevent `@/lib/db` imports in `app/**/*.tsx` pages
- [x] Add check to discourage direct server action imports in large dashboard clients
- [x] Add CI job for compliance checklist verification
- [x] Add periodic architecture drift report script

## Domain Rollout Order

1. Users / Roles
2. Products / Categories
3. Inventory
4. Orders / Payments
5. Reviews
6. Customers
7. Reports
8. Settings / Profile

## Definition of Done

- [ ] Interactive admin flows use TanStack Query as primary client data layer
- [ ] Admin API routes exist for all dashboard domains
- [ ] Route pages do not import `db` directly
- [ ] RBAC enforced at route handler/action boundaries
- [ ] Touch-first audit completed on admin surface
- [ ] Docs reflect implemented architecture and conventions
