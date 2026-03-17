import { pgEnum } from "drizzle-orm/pg-core"

/**
 * User roles in the system.
 * - customer: Regular customer who can browse and purchase
 * - admin: Full system access
 * - manager: Operations access (products, orders, inventory)
 * - support: Customer support and review moderation
 */
export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "admin",
  "manager",
  "support",
])

/**
 * Order status following a strict state machine.
 * Transitions are validated server-side.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending_payment",
  "paid",
  "processing",
  "packing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
])

/**
 * Payment status for tracking payment lifecycle.
 */
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "cancelled",
])

/**
 * Payment methods supported by the platform.
 */
export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "bank_transfer",
  "cash_on_delivery",
])

/**
 * Inventory tracking mode per variant.
 * - quantity: stock is managed using aggregate counts only
 * - serial: stock is managed as individual physical units
 */
export const inventoryTrackingModeEnum = pgEnum("inventory_tracking_mode", [
  "quantity",
  "serial",
])

/**
 * Inventory transaction types for the new inventory domain.
 */
export const inventoryTransactionTypeEnum = pgEnum(
  "inventory_transaction_type",
  [
    "receipt",
    "adjustment_increase",
    "adjustment_decrease",
    "reservation",
    "reservation_release",
    "allocation",
    "allocation_release",
    "shipment",
    "return",
    "damage",
    "loss",
    "transfer_out",
    "transfer_in",
  ],
)

/**
 * Status for serialized inventory units.
 */
export const inventoryUnitStatusEnum = pgEnum("inventory_unit_status", [
  "received",
  "available",
  "reserved",
  "allocated",
  "packed",
  "shipped",
  "returned",
  "damaged",
  "lost",
])

/**
 * Supported identifier types for serialized units.
 */
export const inventoryIdentifierTypeEnum = pgEnum("inventory_identifier_type", [
  "serial",
  "imei",
  "imei2",
  "barcode",
])

/**
 * Product status for catalog management.
 */
export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
])

/**
 * Product draft wizard step for resume behavior in the admin editor.
 */
export const productDraftStepEnum = pgEnum("product_draft_step", [
  "basics",
  "organization",
  "media",
  "options",
  "review",
])

/**
 * Storage provider backing a media asset.
 */
export const mediaStorageProviderEnum = pgEnum("media_storage_provider", [
  "vercel_blob",
  "external_url",
])

/**
 * Access level for a media asset in the backing store.
 */
export const mediaAccessEnum = pgEnum("media_access", ["public", "private"])

/**
 * Supported first-class media asset kinds.
 */
export const mediaKindEnum = pgEnum("media_kind", ["image", "video"])

/**
 * Lifecycle state for media assets managed by the app.
 */
export const mediaStatusEnum = pgEnum("media_status", [
  "pending",
  "ready",
  "failed",
  "deleted",
])

/**
 * Derivative assets generated from a source media asset.
 */
export const mediaDerivativeKindEnum = pgEnum("media_derivative_kind", [
  "blur",
  "poster",
])

/**
 * Review status for moderation workflow.
 */
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
])

/**
 * Address type for customer addresses.
 */
export const addressTypeEnum = pgEnum("address_type", [
  "shipping",
  "billing",
  "both",
])
