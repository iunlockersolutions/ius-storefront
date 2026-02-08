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
 * Inventory movement types for ledger-based tracking.
 * Every stock change creates a movement record.
 */
export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "purchase", // Stock received from supplier
  "sale", // Stock sold to customer
  "adjustment", // Manual adjustment (correction)
  "return", // Customer return
  "transfer", // Transfer between locations
  "damaged", // Damaged/lost stock
  "reserved", // Reserved for pending order
  "released", // Released from reservation
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
