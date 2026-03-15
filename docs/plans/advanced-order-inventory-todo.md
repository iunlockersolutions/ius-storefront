# Advanced Order and Inventory Implementation Todo

## Phase A: Foundation

- [x] Create architecture plan and implementation todo docs.
- [x] Add configurable hold timeout setting (default 60 min).
- [x] Add order fields for hold expiry and bank transfer reference.
- [x] Update checkout order creation to transition by payment method.

## Phase B: Checkout UX and Data

- [x] Implement billing/shipping copy toggles for partially saved addresses.
- [x] Complete saved-address orchestration for all 4 customer profile cases.
- [x] Snapshot full billing and shipping details per order.
- [x] Ensure optional authenticated address persistence is robust.

## Phase C: Inventory Buckets

- [x] Formalize inventory bucket terminology in code and docs.
- [x] Enforce sellable-stock formula in availability checks.
- [x] Add hold-expiry release workflow.
- [x] Add guardrails for concurrent checkout to prevent oversell.

## Phase D: Admin Fulfillment

- [x] Keep real assignment only in prepare/packing.
- [x] Quantity mode: convert hold to allocation during prepare.
- [x] Serial mode: require scan and explicit unit assignment.
- [x] Add duplicate/wrong-variant/already-assigned scan safeguards.

## Phase E: Order Management Actions

- [x] Add complete cancel matrix by status with correct inventory reversal.
- [x] Add refund flow with line-level disposition options.
- [x] Add complete status transition audit requirements.

## Phase F: Reliability and Rollout

- [x] Add scheduled trigger (Vercel cron/job) for expired order hold release endpoint.
- [x] Add idempotency keys and retry-safe mutation semantics.
- [x] Add migration/backfill for in-flight orders and reservations.
- [x] Add integration tests for payment + inventory lifecycle.
- [x] Update docs and runbooks for operations and support.
