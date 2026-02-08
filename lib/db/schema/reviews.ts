import { relations } from "drizzle-orm"
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { products } from "./catalog"
import { reviewStatusEnum } from "./enums"
import { orders } from "./orders"

/**
 * Reviews - Customer product reviews.
 * Only customers who purchased the product can leave reviews.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }), // Link to purchase for verification

    rating: integer("rating").notNull(), // 1-5
    title: text("title"),
    content: text("content"),

    status: reviewStatusEnum("status").notNull().default("pending"),

    // Helpful votes
    helpfulCount: integer("helpful_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reviews_product_id_idx").on(table.productId),
    index("reviews_user_id_idx").on(table.userId),
    index("reviews_status_idx").on(table.status),
    index("reviews_rating_idx").on(table.rating),
    // One review per user per product
    unique("reviews_user_product_unique").on(table.userId, table.productId),
  ],
)

/**
 * Review Helpful Votes - Track which users found reviews helpful
 */
export const reviewHelpfulVotes = pgTable(
  "review_helpful_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("review_helpful_votes_review_id_idx").on(table.reviewId),
    index("review_helpful_votes_user_id_idx").on(table.userId),
    // One vote per user per review
    unique("review_helpful_votes_user_review_unique").on(
      table.userId,
      table.reviewId,
    ),
  ],
)

/**
 * Review moderation - Moderation actions on reviews.
 */
export const reviewModeration = pgTable(
  "review_moderation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    moderatorId: uuid("moderator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // 'approve', 'reject', 'flag'
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("review_moderation_review_id_idx").on(table.reviewId),
    index("review_moderation_moderator_id_idx").on(table.moderatorId),
  ],
)

// Relations
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [reviews.userId],
    references: [user.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  moderationHistory: many(reviewModeration),
  helpfulVotes: many(reviewHelpfulVotes),
}))

export const reviewHelpfulVotesRelations = relations(
  reviewHelpfulVotes,
  ({ one }) => ({
    review: one(reviews, {
      fields: [reviewHelpfulVotes.reviewId],
      references: [reviews.id],
    }),
    user: one(user, {
      fields: [reviewHelpfulVotes.userId],
      references: [user.id],
    }),
  }),
)

export const reviewModerationRelations = relations(
  reviewModeration,
  ({ one }) => ({
    review: one(reviews, {
      fields: [reviewModeration.reviewId],
      references: [reviews.id],
    }),
    moderator: one(user, {
      fields: [reviewModeration.moderatorId],
      references: [user.id],
    }),
  }),
)
