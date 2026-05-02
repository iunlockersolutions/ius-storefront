import { relations } from "drizzle-orm"
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { user } from "./auth"
import { notificationTypeEnum } from "./enums"

/**
 * Per-recipient notifications.
 * Fan-out happens at write time (one row per staff recipient per event)
 * so unread counts are a trivial indexed query.
 *
 * `targetRef` is a polymorphic pointer like `"contact_message:<uuid>"` so
 * future notification types can reuse the same table.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    targetRef: text("target_ref").notNull(),

    title: text("title").notNull(),
    preview: text("preview").notNull(),

    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_recipient_idx").on(table.recipientId),
    index("notifications_recipient_read_idx").on(
      table.recipientId,
      table.readAt,
    ),
    index("notifications_recipient_created_idx").on(
      table.recipientId,
      table.createdAt,
    ),
  ],
)

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(user, {
    fields: [notifications.recipientId],
    references: [user.id],
  }),
}))
