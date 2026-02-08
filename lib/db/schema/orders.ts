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
import { customerAddresses } from "./customer"
import { orderStatusEnum } from "./enums"

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
      onDelete: "set null",
    }),

    // Denormalized product data (preserved at time of order)
    productName: text("product_name").notNull(),
    variantName: text("variant_name").notNull(),
    sku: text("sku").notNull(),

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

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
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
  statusHistory: many(orderStatusHistory),
  shipments: many(shipments),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
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
