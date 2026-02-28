# Admin API Contracts

This document defines implementation contracts for admin endpoints under `app/api/admin/**`.

## Required Handler Pattern

Each route handler should follow this sequence:

1. Enforce permission with `requireAdminApiPermission(resource, action)`.
2. Parse and validate params/query/body.
3. Call domain logic in `lib/actions/*`.
4. For privileged mutations, log activity with `auditAdminMutation(...)` after success.
5. Return standardized response envelope using `ok(...)` or `fail(...)`.
6. Map unexpected errors through `mapErrorToApi(...)`.

## Standard Response Envelope

- Success: `ok(data, status?)`.
- Known failures: `fail(code, message, status, details?)` or `failFromMessage(...)`.
- Unknown failures: `mapErrorToApi(error)`.

Error code taxonomy:

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_ERROR`

## Endpoint Shape by Operation

- List endpoints: parse pagination/filter query params and return `{ items, pagination }` or domain-specific aggregate payload.
- Detail endpoints: return one entity payload and use `NOT_FOUND` when missing.
- Mutation endpoints: validate payload, execute write, audit mutation, return updated entity/result.

## Security and Audit Requirements

- Every admin endpoint must enforce explicit resource/action permissions.
- Every privileged mutation route (`POST`, `PUT`, `PATCH`, `DELETE`) must call `auditAdminMutation(...)` on success.
- Destructive operations require elevated actions (for example delete/ban/verify) not generic read/list permissions.

## Implementation References

- Response helpers: `lib/utils/api-response.ts`
- Permission and audit wrapper: `lib/auth/admin-api.ts`
- Full review checklist: `docs/architecture/admin-endpoint-security-checklist.md`
