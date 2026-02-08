import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Newsletter Subscribers - Email list for marketing.
 */
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [index("newsletter_subscribers_email_idx").on(table.email)],
)
