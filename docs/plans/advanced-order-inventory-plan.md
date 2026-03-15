# Advanced Order and Inventory Alignment Plan

## Objective

Align storefront ordering and ops fulfillment with the advanced inventory model so that:

- sellable stock is reduced at order time without assigning real physical units
- physical assignment (especially serial/IMEI/barcode units) happens only in admin prepare/packing
- payment method behavior and order states are explicit, auditable, and consistent

## Approved Decisions

- Card payments are immediate success for now (no external gateway), with architecture ready for future gateway integration.
- Hold timeout is configurable, default `60` minutes.
- Sellable stock formula is:
  - `available_to_sell = on_hand - active_order_holds - allocated`
- Bank transfer creates pending payment with a readable customer reference.
- Refunds use line-level admin disposition (`restock`, `damaged`, `lost`, `no-return`).
- Real serialized units are never auto-assigned on order creation.

## Phased Plan

1. Define canonical order and inventory lifecycle states and transition rules.
2. Introduce explicit inventory bucket semantics (`on_hand`, `order_hold`, `allocated`, `available_to_sell`).
3. Implement configurable hold expiry and automated release.
4. Refactor checkout address orchestration for all customer profiles:
   - logged-in with both addresses
   - logged-in with one address + copy toggle
   - logged-in with no addresses
   - guest checkout
5. Implement payment behavior matrix:
   - card immediate success
   - bank transfer pending with reference and expiry rules
   - COD standard processing path
6. Ensure order creation only creates holds (no physical assignment).
7. Keep physical assignment in admin prepare/packing:
   - quantity: hold -> allocated
   - serial: scan -> assign -> allocate
8. Extend admin actions: cancel, refund, status change with inventory-safe transitions.
9. Add API and UI updates for new buckets and order states.
10. Add concurrency, idempotency, and audit hardening.
11. Execute migration/backfill strategy for open orders.
12. Update docs/runbooks and complete validation.

## First Implementation Slice

This slice establishes core behavior that can be safely rolled out first:

- configurable order hold timeout
- order-level hold expiration timestamp
- order-level bank transfer reference
- checkout transitions by payment method with payment records

## Verification Focus

1. Checkout creates expected order status by payment method.
2. Payment row is created with expected method/status.
3. Bank transfer orders include readable reference and hold expiry.
4. Card and COD paths do not require pending payment state.
5. Existing packing/scan flow remains unchanged.

## Phase C Implementation Notes

- Canonical inventory buckets are now treated as:
   - `on_hand`
   - `order_hold` (`reserved_quantity`)
   - `allocated`
   - `available_to_sell = on_hand - order_hold - allocated`
- Customer-facing stock checks now use sellable quantity (`available_to_sell`) in cart and checkout flows.
- Expired order holds are released through a dedicated workflow that:
   - finds expired orders with cancellable pre-fulfillment statuses
   - releases reservations
   - cancels orders with status history entries
- A secured internal route exists for scheduled expiry processing:
   - `POST /api/internal/orders/release-expired-holds`
   - auth via cron secret header or staff permission fallback.

Given current implementation goals, this project now optimizes for the new model directly and does not preserve legacy order-management compatibility paths.

## Operations Checklist (Cron Hold Expiry)

- Scheduled triggering is currently disabled in this repo.
- See [docs/plans/deferred-hold-expiry-cron.md](docs/plans/deferred-hold-expiry-cron.md) for enablement steps when plan limits allow it.
- Set one of these production environment variables in Vercel:
   - `CRON_SECRET` (recommended, native Vercel convention)
   - `ORDER_HOLD_CRON_SECRET` (project-specific override)
- Endpoint auth behavior:
   - accepts `Authorization: Bearer <secret>`
   - accepts `x-cron-secret: <secret>`
   - if no valid cron secret is provided, staff permission is required.
- Manual verification (post-deploy):
   - `POST /api/internal/orders/release-expired-holds?limit=10`
   - confirm response includes `scanned`, `released`, and `orderIds`.

## Phase E Implementation Notes

- Status updates now enforce required audit notes for manual transitions.
- Cancellation uses a dedicated action and explicit matrix:
   - allowed: `draft`, `pending_payment`, `paid`, `processing`, `packing`
   - blocked: `shipped`, `delivered`, `cancelled`, `refunded`
- Refund uses a dedicated action from `delivered` status only.
- Refund supports per-line disposition choices:
   - `restock`
   - `damaged`
   - `lost`
   - `no-return`
- Inventory impact is applied per line disposition during refund processing.

## Phase F Implementation Notes

- Cancel and refund admin mutations are now retry-safe:
   - optional idempotency keys are accepted through admin API routes and mutation hooks
   - order rows are locked during cancel/refund processing
   - repeated requests for already-terminal states return idempotent success
   - refund payment rows use deterministic or provided idempotency keys
- Added a backfill utility for in-flight data:
   - script: `pnpm ops:backfill:order-holds`
   - optional dry run: `pnpm ops:backfill:order-holds -- --dry-run`
   - ensures missing hold expiry timestamps on hold statuses
   - re-ensures reservation consistency for payment/fulfillment statuses
- Added lifecycle integrity verification script for rollout gates:
   - script: `pnpm ops:check:lifecycle`
   - validates order/payment/inventory invariants, including:
      - reservation deltas aligned with order line quantities for active statuses
      - zero reservation net for terminal cancelled/refunded orders
      - payment record alignment for pending/paid/refunded/active fulfillment statuses
      - aggregate inventory `available = on_hand - reserved - allocated`

## Operations Runbook Additions

- Pre-rollout validation:
   - run `pnpm ops:check:lifecycle`
   - if violations are reported, resolve and rerun until clean
- Backfill execution:
   - execute dry run first: `pnpm ops:backfill:order-holds -- --dry-run`
   - execute real run: `pnpm ops:backfill:order-holds`
   - rerun lifecycle check: `pnpm ops:check:lifecycle`
- Retry safety guidance:
   - if admin action requests are retried by client/network, preserve the same idempotency key
   - duplicate submissions with same idempotency key should be treated as safe replays
