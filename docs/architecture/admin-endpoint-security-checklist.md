# Admin Endpoint Security Checklist

Use this checklist whenever adding or modifying an endpoint under `app/api/admin/**`.

## Access Control

- [ ] Endpoint enforces explicit permission checks with `requireAdminApiPermission(resource, action)`.
- [ ] Chosen `resource`/`action` pair matches the operation scope (read/list/create/update/delete/ban/verify/etc.).
- [ ] No authorization is delegated to client-side checks.

## Validation and Error Handling

- [ ] Request params/query/body are validated before invoking domain mutations.
- [ ] Invalid payloads return structured API errors via `fail(...)` / `failFromMessage(...)`.
- [ ] Handler returns a consistent response envelope (`ok(...)` / `fail(...)`).

## Mutation Auditing

- [ ] Every privileged mutation (`POST`/`PUT`/`PATCH`/`DELETE`) records activity with `auditAdminMutation(...)` after success.
- [ ] Audit action string accurately represents the operation (for example `product.update`, `user.ban`).
- [ ] Audit includes `entityType`, and `entityId`/`details` when available.

## Destructive and Sensitive Operations

- [ ] Destructive operations (delete, ban, reset password, revoke sessions, moderation reject) require the appropriate elevated permission.
- [ ] Sensitive mutations avoid logging secrets or raw credentials in `details`.
- [ ] Endpoint behavior is idempotent/safe where applicable.

## Final Verification

- [ ] Route is included in admin route coverage checks (`app/api/admin/**/route.ts`).
- [ ] TypeScript diagnostics are clean for changed files.
- [ ] `docs/refactor-full-codebase-todo.md` is updated when milestone status changes.