# RBAC Boundaries

This document defines where authorization is enforced and how layers work together.

## Layer 1: Edge Proxy Boundary

- File: `proxy.ts`
- Responsibility:
  - Mask unauthorized `/admin` access.
  - Enforce basic staff cookie presence checks.
  - Redirect forced password-change flows.

This layer is a first gate and is not sufficient on its own.

## Layer 2: Admin Layout Boundary

- File: `app/admin/layout.tsx`
- Responsibility:
  - Require authenticated session.
  - Ensure current user is staff (`isStaff`).
  - Redirect unauthorized users out of admin surface.

This layer protects route rendering for admin pages.

## Layer 3: API and Action Boundary

- Files:
  - `lib/auth/rbac.ts`
  - `lib/auth/admin-api.ts`
  - `app/api/admin/**/route.ts`
- Responsibility:
  - Enforce resource-action permission checks per endpoint.
  - Guard privileged writes server-side regardless of client UI state.
  - Record mutation audit trails for privileged operations.

This is the authoritative authorization boundary for data operations.

## Role and Permission Model

- Roles: `customer`, `support`, `manager`, `admin`
- Permission map source: `ROLE_PERMISSIONS` in `lib/auth/rbac.ts`
- Permission format: `resource.action` (for example `order.update`, `staff.ban`)

## Enforcement Rules

- Never rely on client-side checks for authorization.
- All admin API handlers must call `requireAdminApiPermission(...)`.
- Destructive operations must use explicit destructive permissions.
- Keep DB access in server-only modules and guarded boundaries.
