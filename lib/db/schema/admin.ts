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

/**
 * Site Settings - Key-value store for site configuration.
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    updatedBy: uuid("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("site_settings_key_idx").on(table.key)],
)

/**
 * Admin activity logs - Audit trail for admin actions.
 * Logs all significant admin actions for security and debugging.
 */
export const adminActivityLogs = pgTable(
  "admin_activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // e.g., 'product.create', 'order.update_status'
    entityType: text("entity_type"), // e.g., 'product', 'order'
    entityId: text("entity_id"), // Can be UUID or other ID formats (e.g., BetterAuth user IDs)
    details: jsonb("details").$type<Record<string, unknown>>(), // Additional context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_activity_logs_user_id_idx").on(table.userId),
    index("admin_activity_logs_action_idx").on(table.action),
    index("admin_activity_logs_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    index("admin_activity_logs_created_at_idx").on(table.createdAt),
  ],
)

// Relations
export const adminActivityLogsRelations = relations(
  adminActivityLogs,
  ({ one }) => ({
    user: one(user, {
      fields: [adminActivityLogs.userId],
      references: [user.id],
    }),
  }),
)
