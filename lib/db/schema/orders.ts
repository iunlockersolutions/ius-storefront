import { relations } from "drizzle-orm"
import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { productVariants } from "./catalog"
import { checkoutSessions } from "./checkout"
import { customerAddresses } from "./customer"
import {
  guestOrderAccessTokenKindEnum,
  orderFulfillmentStatusEnum,
  orderPaymentStatusEnum,
  orderStatusEnum,
  paymentMethodEnum,
} from "./enums"
import { inventoryUnits } from "./inventory"

/**
 * Orders - Customer orders.
 * Contains denormalized address data to preserve historical accuracy.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    status: orderStatusEnum("status").notNull().default("draft"),
    checkoutSessionId: uuid("checkout_session_id").references(
      () => checkoutSessions.id,
      { onDelete: "set null" },
    ),
    paymentMethod: paymentMethodEnum("payment_method"),
    paymentStatus: orderPaymentStatusEnum("payment_status")
      .notNull()
      .default("unpaid"),
    fulfillmentStatus: orderFulfillmentStatusEnum("fulfillment_status")
      .notNull()
      .default("confirmed"),
    currencyCode: text("currency_code").notNull().default("LKR"),
    shippingMethod: text("shipping_method").notNull().default("standard"),
    placedAt: timestamp("placed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

    // Denormalized shipping address (preserved at time of order)
    shippingAddressId: uuid("shipping_address_id").references(
      () => customerAddresses.id,
      { onDelete: "set null" },
    ),
    shippingAddress: jsonb("shipping_address").$type<{
      recipientName: string
      phone: string
      addressLine1: string
      addressLine2?: string
      city: string
      state?: string
      postalCode: string
      country: string
      instructions?: string
    }>(),

    // Denormalized billing address
    billingAddressId: uuid("billing_address_id").references(
      () => customerAddresses.id,
      { onDelete: "set null" },
    ),
    billingAddress: jsonb("billing_address").$type<{
      recipientName: string
      phone: string
      addressLine1: string
      addressLine2?: string
      city: string
      state?: string
      postalCode: string
      country: string
    }>(),

    // Totals (calculated server-side)
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    // Customer info (for guest orders)
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone"),
    customerName: text("customer_name"),

    notes: text("notes"),
    adminNotes: text("admin_notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_order_number_idx").on(table.orderNumber),
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_fulfillment_status_idx").on(table.fulfillmentStatus),
    index("orders_customer_email_idx").on(table.customerEmail),
    index("orders_created_at_idx").on(table.createdAt),
  ],
)

/**
 * Order items - Products in an order.
 * Contains denormalized product data to preserve historical accuracy.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "restrict",
    }),

    // Denormalized product data (preserved at time of order)
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull(),
    variantName: text("variant_name").notNull(),
    sku: text("sku").notNull(),
    snapshot: jsonb("snapshot")
      .$type<{
        productId: string
        variantId: string | null
        productName: string
        productSlug: string
        variantName: string
        sku: string
        manageInventory: boolean
        trackingMode: "quantity" | "serial" | null
        receiptIdentifierTypes: Array<"serial" | "imei" | "imei2" | "barcode">
        unitPrice: string
        currency: "LKR"
      }>()
      .notNull(),

    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_variant_id_idx").on(table.variantId),
  ],
)

/**
 * Order status history - Audit trail for order status changes.
 */
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    notes: text("notes"),
    changedBy: uuid("changed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_status_history_order_id_idx").on(table.orderId),
    index("order_status_history_created_at_idx").on(table.createdAt),
  ],
)

/**
 * Shipments - Shipping information for orders.
 */
export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("shipments_order_id_idx").on(table.orderId),
    index("shipments_tracking_number_idx").on(table.trackingNumber),
  ],
)

/**
 * Order item allocations - aggregate stock allocations for an order item.
 * Used for quantity-based inventory and location-level reservation/allocation.
 */
export const orderItemAllocations = pgTable(
  "order_item_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    allocatedAt: timestamp("allocated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_item_allocations_order_id_idx").on(table.orderId),
    index("order_item_allocations_order_item_id_idx").on(table.orderItemId),
    index("order_item_allocations_variant_id_idx").on(table.variantId),
  ],
)

/**
 * Order item unit assignments - exact serialized inventory units assigned to an
 * order item during packing and shipment preparation.
 */
export const orderItemUnitAssignments = pgTable(
  "order_item_unit_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    inventoryUnitId: uuid("inventory_unit_id")
      .notNull()
      .references(() => inventoryUnits.id, { onDelete: "cascade" })
      .unique(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    unassignedAt: timestamp("unassigned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_item_unit_assignments_order_id_idx").on(table.orderId),
    index("order_item_unit_assignments_order_item_id_idx").on(
      table.orderItemId,
    ),
    index("order_item_unit_assignments_inventory_unit_id_idx").on(
      table.inventoryUnitId,
    ),
  ],
)

export const guestOrderAccessTokens = pgTable(
  "guest_order_access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    kind: guestOrderAccessTokenKindEnum("kind").notNull().default("access"),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("guest_order_access_tokens_order_id_idx").on(table.orderId),
    index("guest_order_access_tokens_email_idx").on(table.email),
    index("guest_order_access_tokens_kind_idx").on(table.kind),
  ],
)

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  checkoutSession: one(checkoutSessions, {
    fields: [orders.checkoutSessionId],
    references: [checkoutSessions.id],
  }),
  shippingAddressRef: one(customerAddresses, {
    fields: [orders.shippingAddressId],
    references: [customerAddresses.id],
  }),
  billingAddressRef: one(customerAddresses, {
    fields: [orders.billingAddressId],
    references: [customerAddresses.id],
  }),
  items: many(orderItems),
  allocations: many(orderItemAllocations),
  unitAssignments: many(orderItemUnitAssignments),
  statusHistory: many(orderStatusHistory),
  shipments: many(shipments),
  guestAccessTokens: many(guestOrderAccessTokens),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  allocations: many(orderItemAllocations),
  unitAssignments: many(orderItemUnitAssignments),
}))

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
    changedByUser: one(user, {
      fields: [orderStatusHistory.changedBy],
      references: [user.id],
    }),
  }),
)

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}))

export const orderItemAllocationsRelations = relations(
  orderItemAllocations,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderItemAllocations.orderId],
      references: [orders.id],
    }),
    orderItem: one(orderItems, {
      fields: [orderItemAllocations.orderItemId],
      references: [orderItems.id],
    }),
    variant: one(productVariants, {
      fields: [orderItemAllocations.variantId],
      references: [productVariants.id],
    }),
  }),
)

export const orderItemUnitAssignmentsRelations = relations(
  orderItemUnitAssignments,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderItemUnitAssignments.orderId],
      references: [orders.id],
    }),
    orderItem: one(orderItems, {
      fields: [orderItemUnitAssignments.orderItemId],
      references: [orderItems.id],
    }),
    inventoryUnit: one(inventoryUnits, {
      fields: [orderItemUnitAssignments.inventoryUnitId],
      references: [inventoryUnits.id],
    }),
  }),
)

export const guestOrderAccessTokensRelations = relations(
  guestOrderAccessTokens,
  ({ one }) => ({
    order: one(orders, {
      fields: [guestOrderAccessTokens.orderId],
      references: [orders.id],
    }),
  }),
)
