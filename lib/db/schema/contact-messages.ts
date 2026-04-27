import { relations } from "drizzle-orm"
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { contactMessageEventTypeEnum, contactMessageStatusEnum } from "./enums"

/**
 * Contact messages submitted from the storefront contact form.
 * Sender fields are denormalized so guest submissions outlive any later
 * account deletion; `userId` is set when the submitter was authenticated.
 */
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    senderPhone: text("sender_phone"),
    message: text("message").notNull(),

    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    status: contactMessageStatusEnum("status").notNull().default("unread"),
    assigneeId: uuid("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),

    clientIp: text("client_ip"),
    userAgent: text("user_agent"),

    // Forward-compat for v2 product/order linking (null in v1).
    context: jsonb("context")
      .$type<{ productId?: string; orderId?: string } | null>()
      .default(null),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
  },
  (table) => [
    index("contact_messages_status_idx").on(table.status),
    index("contact_messages_assignee_idx").on(table.assigneeId),
    index("contact_messages_user_idx").on(table.userId),
    index("contact_messages_email_idx").on(table.senderEmail),
    index("contact_messages_created_at_idx").on(table.createdAt),
  ],
)

/**
 * Events on a contact message thread.
 * `reply_sent` is rendered to customers; `status_changed` and `assigned`
 * are staff-only audit entries.
 */
export const contactMessageEvents = pgTable(
  "contact_message_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactMessageId: uuid("contact_message_id")
      .notNull()
      .references(() => contactMessages.id, { onDelete: "cascade" }),
    type: contactMessageEventTypeEnum("type").notNull(),
    actorId: uuid("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // type=reply_sent: { body: string }
    // type=status_changed: { from, to }
    // type=assigned: { fromAssigneeId, toAssigneeId }
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contact_message_events_message_idx").on(table.contactMessageId),
    index("contact_message_events_created_at_idx").on(table.createdAt),
  ],
)

export const contactMessagesRelations = relations(
  contactMessages,
  ({ one, many }) => ({
    user: one(user, {
      fields: [contactMessages.userId],
      references: [user.id],
      relationName: "contact_message_user",
    }),
    assignee: one(user, {
      fields: [contactMessages.assigneeId],
      references: [user.id],
      relationName: "contact_message_assignee",
    }),
    events: many(contactMessageEvents),
  }),
)

export const contactMessageEventsRelations = relations(
  contactMessageEvents,
  ({ one }) => ({
    message: one(contactMessages, {
      fields: [contactMessageEvents.contactMessageId],
      references: [contactMessages.id],
    }),
    actor: one(user, {
      fields: [contactMessageEvents.actorId],
      references: [user.id],
    }),
  }),
)
