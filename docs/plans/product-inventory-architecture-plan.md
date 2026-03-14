# Product Creation and Inventory Architecture Plan

## Context and Goals

This plan defines the target architecture for rebuilding product creation and inventory management in the ops dashboard.

The platform sells electronic devices and accessories. That creates two inventory realities:

- Some variants can be managed with simple quantity counts.
- Some variants must be tracked as individual physical units with unique identifiers such as serial number, IMEI, or barcode.

The approved direction is to replace the current product and inventory implementation rather than preserve backward compatibility. Existing legacy product and inventory code may be removed or rewritten where needed.

Primary goals:

- Support product creation as a draft-first, step-based admin workflow.
- Allow one product to belong to multiple categories, with exactly one primary category.
- Keep one brand and one model per product.
- Manage inventory at the variant level.
- Support both quantity-only and serialized inventory flows.
- Reserve stock at order time, but assign exact serialized units only during order processing and packing.
- Make the system location-ready from day one, with one default stock location in v1.

## Core Terminology

Use the following terms consistently across schema, APIs, UI, tests, and docs:

- `product`: the customer-facing catalog entity.
- `variant`: the sellable SKU under a product.
- `inventory level`: aggregate available, reserved, allocated, and on-hand stock for one variant at one location.
- `inventory unit`: one physical serialized item tracked individually.
- `reservation`: stock held for an order before packing or shipment.
- `allocation`: assignment of stock to a specific order item during fulfillment.
- `shipment`: the handoff state where stock leaves the business and becomes fulfilled.

## Industry Reference Summary

The design follows patterns used by major commerce and ERP systems.

- Shopify models inventory around variants, inventory items, and inventory levels, with stock tracked per location.
  - https://shopify.dev/docs/api/admin-graphql/latest/objects/ProductVariant
  - https://shopify.dev/docs/api/admin-graphql/latest/objects/InventoryItem
  - https://shopify.dev/docs/api/admin-rest/2025-01/resources/inventorylevel
  - https://shopify.dev/docs/api/admin-graphql/latest/mutations/productcreate
- BigCommerce treats variants as the SKU-level sellable units and separates catalog structure from inventory location operations.
  - https://developer.bigcommerce.com/docs/rest-catalog/product-variants
  - https://developer.bigcommerce.com/docs/store-operations/catalog
  - https://developer.bigcommerce.com/docs/store-operations/catalog/inventory-locations
- Medusa separates catalog, inventory levels, reservations, and locations, which aligns with a service-oriented inventory domain.
  - https://docs.medusajs.com/resources/commerce-modules/product/variant-inventory
  - https://docs.medusajs.com/resources/commerce-modules/inventory/concepts
  - https://docs.medusajs.com/user-guide/inventory/reservations
- Odoo and Zoho document serialized inventory flows where each unit is received, scanned, and fulfilled individually.
  - https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/product_tracking/serial_numbers.html
  - https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/barcode/setup/serial_numbers_lots.html
  - https://www.zoho.com/us/inventory/kb/advanced-inventory-tracking/barcode-scanning-for-serial-numbers.html

Key takeaways adopted here:

- Variant is the inventory boundary.
- Inventory reads need an aggregate stock model for speed.
- Inventory writes need a ledger and traceability model.
- Serialized stock must exist as unit-level records, not only quantity counts.
- Exact serialized unit assignment should happen during packing, not at order creation.
- Multi-location should be represented in the data model even if only one default location is active initially.

## Catalog Architecture

### Product Structure

- Keep `brands`, `categories`, and `models` as first-class catalog entities.
- Do not recreate those entities from product creation unless the flow explicitly allows it.
- Categories remain select-only in the product flow.
- Brand and model remain creatable inline from the product flow.

### Category Assignment Rules

- A product can belong to multiple categories.
- Exactly one product category assignment must be marked as primary.
- The primary category is the category used for model compatibility, merchandising defaults, and primary product classification.
- Category assignment should live in a join table that stores at least:
  - `productId`
  - `categoryId`
  - `isPrimary`
  - `sortOrder`

The system should stop storing primary-category state in two different ways. The category join table becomes the source of truth.

### Brand and Model Rules

- A product belongs to one brand.
- A product belongs to one model.
- A model remains scoped to one brand and one top-level primary category.
- Product validation must enforce:
  - selected brand matches the model brand
  - selected primary category matches the model primary category

Inline brand and model creation should follow current repo behavior conceptually:

- Brand create-or-reuse by normalized name.
- Model create-or-reuse by normalized name within the selected brand and primary category.
- Default metadata values are acceptable for inline-created brand/model records.

### Options and Variants

- Product options remain product-scoped dimensions such as color, storage, or RAM.
- Variant combinations are generated from selected option values.
- Suggested option names should be derived from the union of selected category option templates.
- Admins can still add product-specific options beyond category suggestions.
- Each variant owns:
  - SKU
  - name
  - pricing fields
  - active status
  - default flag
  - inventory behavior

### Variant Inventory Rules

Inventory is managed per variant. Each variant needs explicit inventory settings:

- `manageInventory: boolean`
- `inventoryTrackingMode: "quantity" | "serial"`

Behavior:

- `quantity`: stock is managed by aggregate counts.
- `serial`: stock is managed by individual physical units.

The tracking mode is chosen when admin starts adding inventory. Once stock exists, the mode should be treated as immutable unless an explicit destructive reset flow is added later.

## Inventory Architecture

### Inventory Domain Separation

Inventory should be its own domain rather than a thin extension of the product editor.

Catalog creation and inventory intake are separate workflows:

- Product wizard creates and publishes product metadata and variants.
- Inventory workflows receive stock, adjust stock, reserve stock, allocate stock, and ship stock.

### Location Model

The schema should be location-ready from the beginning.

V1 behavior:

- one default location

Target schema:

- `inventory_locations`
- `inventory_levels`
- `inventory_transactions`
- `inventory_units`
- `inventory_unit_identifiers`

Legacy compatibility tables such as `inventory_items` and `inventory_movements` should not remain in the final implementation. `inventory_levels` and `inventory_transactions` are the stock source of truth.

### Inventory Levels

`inventory_levels` is the fast read model for one variant at one location.

Recommended fields:

- `variantId`
- `locationId`
- `onHandQuantity`
- `reservedQuantity`
- `allocatedQuantity`
- `availableQuantity`
- `lowStockThreshold`
- timestamps

For quantity-tracked variants:

- levels are directly updated from transactions.

For serial-tracked variants:

- levels are derived from inventory unit state transitions and stored as the operational aggregate read model.

### Inventory Transactions

`inventory_transactions` is the immutable write ledger for auditability and reconciliation.

Recommended transaction types:

- `receipt`
- `adjustment_increase`
- `adjustment_decrease`
- `reservation`
- `reservation_release`
- `allocation`
- `allocation_release`
- `shipment`
- `return`
- `damage`
- `loss`
- `transfer_out`
- `transfer_in`

Each transaction should capture at minimum:

- variant
- location
- quantity delta
- before and after snapshot fields where useful
- reference type and reference id
- performed by
- notes
- timestamps

### Serialized Inventory Units

`inventory_units` stores one row per physical serialized item.

Recommended fields:

- `variantId`
- `locationId`
- `status`
- `receivedAt`
- `allocatedOrderId`
- `allocatedOrderItemId`
- `shippedAt`
- `returnedAt`
- `notes`

Recommended statuses:

- `received`
- `available`
- `reserved`
- `allocated`
- `packed`
- `shipped`
- `returned`
- `damaged`
- `lost`

### Inventory Unit Identifiers

Serialized goods need flexible unique identifiers. A phone may need more than one identifier.

`inventory_unit_identifiers` should support:

- `serial`
- `imei`
- `imei2`
- `barcode`
- optional manufacturer or supplier reference values later

Rules:

- enforce uniqueness per identifier value where appropriate
- allow scan lookup by any stored identifier
- validate duplicates during receipt
- keep identifiers attached to the unit permanently for traceability

### Inventory Intake

Two inventory intake paths are required:

- Quantity intake for quantity-tracked variants
- Scanner-first serialized intake for serial-tracked variants

Serialized intake behavior:

- admin selects variant and location
- admin scans barcode or enters identifiers one unit at a time
- system validates duplicates immediately
- system previews staged units before commit
- system commits units in bulk and records receipt transactions

## Order and Fulfillment Integration

### Reservation Strategy

At order creation or payment authorization time:

- reserve quantity only
- do not bind a specific serialized unit yet

This supports the approved fulfillment rule that exact device selection happens later by staff.

### Allocation Strategy

During `processing` or packing:

- staff scans barcode, serial number, or IMEI
- system finds a matching available unit for the correct variant and location
- system allocates that unit to the specific order item

Allocation becomes the bridge between inventory and fulfillment.

Recommended new allocation data:

- order item allocation rows for bulk inventory
- order item unit assignments for serialized inventory

### Packing and Shipment Rules

- Serialized order lines cannot be packed or shipped until all required units are scanned and assigned.
- Wrong-variant scans must be rejected.
- Duplicate scans in the same packing session must be rejected.
- Already shipped, damaged, lost, or allocated units must be rejected.
- Cancelling or failing payment should release reservations.
- If serialized units were already allocated but not shipped, those units return to available status.
- Once shipped, unit-to-order linkage becomes immutable historical data.

### Customer and Ops Traceability

Orders and shipments should be able to show:

- which variant was sold
- which exact serialized unit was shipped
- which identifiers belonged to that unit

This is essential for warranty, returns, fraud review, and device support.

## Admin API and UI Architecture

### Client-First Admin Pattern

For `app/ops`, use the repo’s preferred client-first architecture:

- API routes under `app/api/admin/**`
- TanStack Query for dashboard data fetching and mutations
- React Hook Form + Zod for forms
- shadcn UI components for the admin surface

### Product Wizard

The product create and edit experience should be one step-based wizard with draft persistence.

Planned steps:

1. Basics
2. Organization
3. Media
4. Options and variants
5. Review

Behavior:

- first meaningful save creates the product draft
- every step persists server-side
- draft stores progress and can be resumed later
- publish is allowed without inventory
- media step is included as a placeholder only for now

### Organization Step

- Categories are select-only.
- One selected category must be marked primary.
- Brand and model use creatable combobox selectors.
- Creating a brand or model from the combobox should create or reuse an existing normalized record.

### Inventory UI

Inventory should move out of the product variant editor and into dedicated flows:

- stock overview page
- variant inventory detail page
- receipt flow
- serialized intake scanner
- movement history
- order packing scanner

The product wizard should configure inventory behavior, not receive stock directly.

### Admin APIs

Planned API surface:

- `POST /api/admin/products`
- `GET /api/admin/products/:id`
- `PATCH /api/admin/products/:id`
- `POST /api/admin/products/:id/publish`
- `POST /api/admin/inventory/receipts`
- `POST /api/admin/inventory/adjustments`
- `GET /api/admin/inventory`
- `GET /api/admin/inventory/:variantId`
- `POST /api/admin/orders/:id/packing/start`
- `POST /api/admin/orders/:id/packing/scan`
- `POST /api/admin/orders/:id/packing/complete`

All admin routes should continue to follow the repo’s admin API contract:

- permission enforcement
- request validation
- domain action layer
- audit logging for mutations
- standard success and error envelopes

## Constraints and Chosen Defaults

- Backward compatibility is intentionally out of scope.
- Legacy product and inventory implementations can be removed or rewritten.
- Inventory is always variant-level.
- Product belongs to one brand and one model.
- Product belongs to multiple categories with exactly one primary category.
- Tracking mode supports both quantity-only and serialized stock.
- Tracking mode is chosen when admin starts adding inventory.
- Exact serialized unit assignment happens during order processing and packing, not at order creation.
- V1 ships with one default inventory location, but the schema remains location-ready.
- Product creation is client-first and uses TanStack Query for dashboard reads and writes.
- Forms use React Hook Form with Zod.
- UI uses shadcn components only.
- Brand and model selectors are creatable.
- Categories are not creatable in the product flow.
- Media upload implementation is deferred; the wizard should show a placeholder step for it.

## Out of Scope for This Architecture Pass

- Backward-compatible migrations
- real media upload workflow
- full multi-location operational UI in v1
- warehouse transfer workflows beyond data-model readiness
- supplier receiving, purchasing, or procurement modules

## Implementation Companion

Execution details, sequencing, test coverage, and cleanup tasks live in:

- [product-inventory-implementation-todo.md](/Users/janith/Projects/ius/ius-storefront/docs/plans/product-inventory-implementation-todo.md)
