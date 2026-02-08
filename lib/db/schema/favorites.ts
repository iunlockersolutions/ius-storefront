import { relations } from "drizzle-orm"
import { index, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core"

import { user } from "./auth"
import { products } from "./catalog"

/**
 * Favorites / Wishlist - Customer's favorite products.
 */
export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("favorites_user_id_idx").on(table.userId),
    index("favorites_product_id_idx").on(table.productId),
    unique("favorites_user_product_unique").on(table.userId, table.productId),
  ],
)

// Relations
export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(user, {
    fields: [favorites.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}))
