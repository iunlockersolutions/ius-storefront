# Instruction Compliance Matrix

This matrix tracks compliance against:

- `.github/instructions/rules.instructions.md`
- `.github/instructions/folder-structure.instructions.md`
- `.github/instructions/stack-preference.instructions.md`
- `.github/copilot-instructions.md`

Status legend:

- `✅` compliant
- `⚠️` partially compliant
- `❌` non-compliant
- `🔄` in progress

## Current State (2026-02-28)

| Area | Rule | Status | Evidence / Notes |
|---|---|---:|---|
| Data flow | Dashboard defaults to client-side + TanStack Query | ✅ | Admin domains now use query/mutation hooks with shared key + invalidation standards. |
| API boundary | Interactive dashboard uses API routes/server handlers | ✅ | Admin API routes implemented across products, categories, inventory, orders, payments, reviews, customers, reports, settings, profile/staff. |
| Route layer | `app/*` stays thin and avoids heavy business logic | ✅ | Route-level DB imports were removed from targeted pages and logic moved to `lib/actions/*` and API boundaries. |
| DB boundary | Drizzle usage is server-only | ✅ | DB used in server actions/routes/pages (server components). |
| UUID policy | UUID IDs + Better Auth UUID generation | ✅ | Better Auth and schema use UUID for primary IDs. |
| RBAC layering | Proxy + layout + action-level checks | ✅ | Multi-layer protection is present for admin surface. |
| UI primitives | Use `components/ui/*`, avoid direct primitive imports in feature code | ✅ | ESLint restrictions enforce this outside `components/ui`. |
| Touch-first UX | Avoid hover-only critical interactions | ✅ | Critical admin table controls were remediated to larger touch-friendly action targets. |
| Route-private colocation | Use `app/**/_components` and `app/**/_actions` for route-local concerns | ⚠️ | `_components` exists in admin, `_actions` is largely absent. |
| Documentation governance | Keep `docs/` aligned with major decisions | ✅ | Architecture docs now cover data flow, API contracts, query key standards, RBAC boundaries, UUID policy, security checklist, and migration decisions. |

## Target End State

- All interactive admin/dashboard data operations are routed through API handlers and TanStack Query.
- No direct DB imports from route pages.
- Consistent API response envelope and error format.
- Route-level files remain orchestration-only.
- Touch-first behavior for critical interactions on small screens.
