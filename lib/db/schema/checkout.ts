import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { carts } from "./cart"
import { checkoutSessionStatusEnum, paymentMethodEnum } from "./enums"

export const checkoutSessions = pgTable(
  "checkout_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    cartSessionId: text("cart_session_id"),
    status: checkoutSessionStatusEnum("status").notNull().default("open"),
    contact: jsonb("contact").$type<{
      email: string
      phone: string
    }>(),
    accountIntent: text("account_intent"),
    shippingAddress: jsonb("shipping_address").$type<{
      recipientName: string
      phone: string
      addressLine1: string
      addressLine2?: string
      city: string
      district?: string
      postalCode?: string
      country: string
      instructions?: string
    }>(),
    billingSameAsShipping: boolean("billing_same_as_shipping")
      .notNull()
      .default(true),
    billingAddress: jsonb("billing_address").$type<{
      recipientName: string
      phone: string
      addressLine1: string
      addressLine2?: string
      city: string
      district?: string
      postalCode?: string
      country: string
      instructions?: string
    }>(),
    shippingMethod: text("shipping_method"),
    paymentMethod: paymentMethodEnum("payment_method"),
    notes: text("notes"),
    pricingSnapshot: jsonb("pricing_snapshot").$type<{
      currency: "LKR"
      subtotal: string
      shippingCost: string
      taxAmount: string
      discountAmount: string
      codFee: string
      total: string
      freeShippingApplied: boolean
    }>(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("checkout_sessions_cart_id_idx").on(table.cartId),
    index("checkout_sessions_user_id_idx").on(table.userId),
    index("checkout_sessions_cart_session_id_idx").on(table.cartSessionId),
    index("checkout_sessions_status_idx").on(table.status),
  ],
)

export const checkoutSessionsRelations = relations(
  checkoutSessions,
  ({ one }) => ({
    cart: one(carts, {
      fields: [checkoutSessions.cartId],
      references: [carts.id],
    }),
    user: one(user, {
      fields: [checkoutSessions.userId],
      references: [user.id],
    }),
  }),
)
