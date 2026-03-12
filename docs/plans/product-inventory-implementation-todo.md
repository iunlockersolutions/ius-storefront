# Product Creation and Inventory Implementation TODO

## Delivery Strategy Summary

This backlog turns the approved product and inventory architecture into an execution plan that can be implemented iteratively.

Guiding rules:

- Backward compatibility is out of scope.
- Legacy product and inventory code can be replaced.
- Terminology must stay consistent with the architecture doc.
- Product creation and inventory intake are separate workflows.
- Serialized stock is reserved by quantity first and assigned by scan during packing.

Reference architecture:

- [product-inventory-architecture-plan.md](/Users/janith/Projects/ius/ius-storefront/docs/plans/product-inventory-architecture-plan.md)

## Phase 1: Schema Reset and Domain Redesign

### Core Implementation Tasks

- Replace the current product-category structure with a join model that supports exactly one primary category per product.
- Design and add new inventory tables:
  - `inventory_locations`
  - `inventory_levels`
  - `inventory_transactions`
  - `inventory_units`
  - `inventory_unit_identifiers`
  - allocation tables for order-item stock binding
- Add variant-level inventory configuration fields for managed stock and tracking mode.
- Remove or deprecate current aggregate-only inventory assumptions in schema definitions.
- Seed one default inventory location.
- Update seed data to produce sample quantity-tracked and serial-tracked variants.

### Dependent Systems To Update

- `lib/db/schema/catalog.ts`
- `lib/db/schema/inventory.ts`
- `lib/db/schema/orders.ts`
- `lib/db/schema/enums.ts`
- `lib/db/schema/index.ts`
- Drizzle migration files
- seed scripts under `lib/db/`

### Validation and Test Scenarios

- Product can hold multiple category assignments and one primary category only.
- Variant can be marked `quantity` or `serial`.
- Default location exists after seed or setup.
- Duplicate serial, IMEI, or barcode values are rejected by schema constraints.
- Inventory level rows are unique per variant and location.

### Exit Criteria

- New schema is migrated successfully.
- Seeds run successfully against the new model.
- Legacy inventory schema is no longer the source of truth.

## Phase 2: Product Draft APIs and Validators

### Core Implementation Tasks

- Add product draft creation endpoint.
- Add product detail endpoint for wizard hydration.
- Add draft update endpoint for step-by-step persistence.
- Add publish endpoint with final validation.
- Move product write logic into catalog-oriented domain functions instead of edit-only mutation logic.
- Add validation for:
  - one brand
  - one model
  - one primary category
  - model compatibility with brand and primary category
  - unique SKU rules
  - variant inventory behavior settings
- Preserve inline create-or-reuse flows for brand and model.

### Dependent Systems To Update

- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- new product publish route
- `lib/actions/product.ts`
- `lib/actions/brand.ts`
- `lib/actions/model.ts`
- admin API audit and permission usage

### Validation and Test Scenarios

- New draft can be created without inventory.
- Draft can be updated step by step.
- Publish fails when required organization or variant rules are invalid.
- Product cannot publish with zero or multiple primary categories.
- Inline brand/model create flows reuse existing normalized entities when appropriate.

### Exit Criteria

- Product draft lifecycle is fully supported by API.
- Update logic no longer assumes product already exists in the old editor flow.

## Phase 3: Product Create and Edit Wizard UI

### Core Implementation Tasks

- Add `/ops/products/new`.
- Rebuild product create and edit UI around one wizard with server-backed draft saves.
- Use shadcn components only.
- Keep wizard steps:
  1. Basics
  2. Organization
  3. Media placeholder
  4. Options and variants
  5. Review
- Add explicit primary category selection in the category UI.
- Keep categories select-only.
- Keep brand/model as creatable combobox inputs.
- Remove stock quantity entry from the variant editor.
- Add saved draft progress, validation feedback, and resume behavior.

### Dependent Systems To Update

- `app/ops/products/page.tsx`
- new `/ops/products/new` page
- `app/ops/products/[id]/edit/page.tsx`
- `components/admin/products/*`
- `hooks/admin/use-admin-products-query.ts`
- new product draft hooks and mutation hooks
- `lib/utils/query-keys.ts`
- `lib/utils/query-invalidation-map.ts`

### Validation and Test Scenarios

- Draft is created on first save and reused for later steps.
- Step continue saves the current state.
- Primary category remains synced with selected categories.
- Option combination generation remains deterministic.
- Duplicate SKUs are blocked in the UI and API.
- Media step renders as a placeholder and does not block completion.

### Exit Criteria

- Admin can create and publish a product without using the legacy editor.
- Edit flow uses the same new architecture as create flow.

## Phase 4: Inventory Engine and Stock Intake Flows

### Core Implementation Tasks

- Build inventory transaction services for:
  - receipt
  - adjustment
  - reservation
  - reservation release
  - allocation
  - allocation release
  - shipment
  - return
  - damage
  - loss
- Implement `inventory_levels` update logic.
- Implement quantity-based receipt flow.
- Implement serialized receipt flow with staged scan entries and duplicate validation.
- Add inventory list and detail APIs based on the new read model.
- Add inventory dashboard UI showing levels, units, and transactions.

### Dependent Systems To Update

- `lib/actions/inventory.ts`
- `app/api/admin/inventory/**`
- `hooks/admin/use-admin-inventory-query.ts`
- `hooks/admin/use-inventory-mutations.ts`
- `hooks/admin/use-inventory-movements-query.ts`
- `components/admin/inventory/*`
- permissions and audit events

### Validation and Test Scenarios

- Quantity receipt increases on-hand and available stock correctly.
- Serialized receipt creates one unit per scanned item and updates aggregate levels.
- Duplicate identifier scans are rejected before commit.
- Inventory level summaries match transaction and unit state totals.
- Low-stock logic still works from the new read model.

### Exit Criteria

- Inventory can be received and adjusted without using legacy quantity-only flows.
- Serialized and quantity variants both work end to end in admin inventory.

## Phase 5: Order Packing and Serialized Allocation

### Core Implementation Tasks

- Add allocation tables and fulfillment state transitions.
- Create order packing APIs:
  - start packing
  - scan unit
  - unassign unit if needed
  - complete packing
- Build packing UI in the order management flow.
- Bind scanned units to order items.
- Block shipment completion until serialized requirements are satisfied.
- Record shipped unit history for traceability.

### Dependent Systems To Update

- `lib/db/schema/orders.ts`
- `lib/actions/order.ts`
- `app/api/admin/orders/**`
- `components/admin/orders/*`
- order detail pages under `app/ops/orders/**`

### Validation and Test Scenarios

- Staff can scan valid units for the correct order line.
- Wrong variant or wrong status units are rejected.
- Duplicate scan in the same packing flow is rejected.
- Order line cannot ship until the required serialized quantity is assigned.
- Assigned unit history remains visible after shipment.

### Exit Criteria

- Serialized unit assignment happens only during processing and packing.
- Shipment traceability exists per order item.

## Phase 6: Storefront, Checkout, Order, and Payment Integration Refactor

### Core Implementation Tasks

- Replace current reservation math based on `inventory_items.quantity` and `reservedQuantity`.
- Update checkout validation to read availability from `inventory_levels`.
- Reserve quantity during order creation without assigning serialized units.
- Update payment completion and failure flows to operate through the inventory transaction layer.
- Ensure cancellation, failure, and return flows release or transition stock correctly.
- Update storefront availability reads to use the new aggregate inventory model.

### Dependent Systems To Update

- `lib/actions/checkout.ts`
- `lib/actions/cart.ts`
- `lib/actions/payment.ts`
- `app/api/payment/webhook/route.ts`
- storefront product detail and cart components
- any code path reading current inventory directly from legacy tables

### Validation and Test Scenarios

- Checkout rejects orders when available quantity is insufficient.
- Reservation is created at order time.
- Payment failure releases reservation.
- Payment success transitions reserved stock into sold or shipped workflow correctly.
- Storefront stock badge and availability reflect the new inventory source.

### Exit Criteria

- Checkout, payment, and storefront no longer depend on legacy inventory tables.
- Reservation and release logic is centralized in the new inventory domain.

## Phase 7: Legacy Cleanup, Docs Refresh, and Verification

### Core Implementation Tasks

- Remove legacy quantity editing from the product editor.
- Remove obsolete inventory tables, action functions, APIs, hooks, and UI where no longer needed.
- Remove or rewrite legacy stock adjustment and movement assumptions.
- Update query keys and invalidation to match the new product draft and inventory APIs.
- Update permissions and audit action names if inventory actions are expanded.
- Refresh architecture and implementation docs if implementation uncovers required clarifications.
- Run project verification checks and targeted testing.

### Dependent Systems To Update

- legacy product and inventory components
- legacy inventory action functions in `lib/actions/product.ts` and `lib/actions/inventory.ts`
- query key and invalidation utilities
- seed cleanup scripts
- internal docs under `docs/`

### Validation and Test Scenarios

- No active admin or storefront flow depends on removed legacy tables.
- Product UI no longer accepts inventory quantities during creation.
- Inventory pages use new terminology consistently.
- All major code areas in scope are reflected in the final implementation.

### Exit Criteria

- Legacy product and inventory system is fully retired.
- Docs, tests, and admin flows reflect the new architecture consistently.

## Explicit Legacy Cleanup and Removal Checklist

- Remove old aggregate-only inventory item assumptions from product creation and edit flows.
- Remove direct stock quantity editing from the current product variant editor.
- Replace legacy inventory overview queries that depend on `quantity - reservedQuantity`.
- Replace checkout and payment logic that writes directly to old inventory tables.
- Remove obsolete API routes that only support the legacy quantity-adjust flow.
- Remove unused hooks and components once the new product and inventory surfaces are live.
- Update or remove old seed logic that inserts inventory in the previous format.

## Cross-Phase Acceptance Checklist

- Catalog schema, actions, and APIs are covered.
- Inventory schema, actions, and APIs are covered.
- Checkout, order, and payment stock behavior are covered.
- Admin product UI is covered.
- Admin inventory UI is covered.
- Query keys and invalidation are covered.
- Permissions and audit events are covered.
- Seeds and migrations are covered.
- Official external references remain in the architecture document only.
- The backlog is implementable without requiring new architectural decisions.
