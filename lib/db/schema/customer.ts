import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { addressTypeEnum } from "./enums"

/**
 * Customer profiles - Extended customer information.
 * Linked to the base users table.
 */
export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    phone: text("phone"),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    preferredLanguage: text("preferred_language").default("en"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("customer_profiles_user_id_idx").on(table.userId)],
)

/**
 * Customer addresses - Shipping and billing addresses.
 * A customer can have multiple addresses.
 */
export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customerProfiles.id, { onDelete: "cascade" }),
    type: addressTypeEnum("type").notNull().default("both"),
    isDefault: boolean("is_default").notNull().default(false),
    label: text("label"), // e.g., "Home", "Office"
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    state: text("state"),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("US"),
    instructions: text("instructions"), // Delivery instructions
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("customer_addresses_customer_id_idx").on(table.customerId)],
)

// Relations
export const customerProfilesRelations = relations(
  customerProfiles,
  ({ one, many }) => ({
    user: one(user, {
      fields: [customerProfiles.userId],
      references: [user.id],
    }),
    addresses: many(customerAddresses),
  }),
)

export const customerAddressesRelations = relations(
  customerAddresses,
  ({ one }) => ({
    customer: one(customerProfiles, {
      fields: [customerAddresses.customerId],
      references: [customerProfiles.id],
    }),
  }),
)
