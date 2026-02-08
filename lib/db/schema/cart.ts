import { relations } from "drizzle-orm"
import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { productVariants } from "./catalog"

/**
 * Carts - Shopping carts for guests and authenticated users.
 * Guest carts use a session ID, auth carts link to user.
 */
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    sessionId: text("session_id"), // For guest carts
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("carts_user_id_idx").on(table.userId),
    index("carts_session_id_idx").on(table.sessionId),
  ],
)

/**
 * Cart items - Items in a shopping cart.
 * Price is stored at time of adding (for display only).
 * Final price is always validated server-side at checkout.
 */
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    priceAtAdd: decimal("price_at_add", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("cart_items_cart_id_idx").on(table.cartId),
    index("cart_items_variant_id_idx").on(table.variantId),
  ],
)

// Relations
export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(user, {
    fields: [carts.userId],
    references: [user.id],
  }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}))
