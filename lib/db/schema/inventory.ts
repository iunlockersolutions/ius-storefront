import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { productVariants } from "./catalog"
import {
  inventoryIdentifierTypeEnum,
  inventoryTransactionTypeEnum,
  inventoryUnitStatusEnum,
} from "./enums"

/**
 * Inventory locations - physical or logical stock locations.
 * V1 will seed a single default location, but the schema is location-ready.
 */
export const inventoryLocations = pgTable(
  "inventory_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    description: text("description"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_locations_code_idx").on(table.code),
    index("inventory_locations_default_idx").on(table.isDefault),
  ],
)

/**
 * Inventory levels - aggregate stock counts per variant and location.
 */
export const inventoryLevels = pgTable(
  "inventory_levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => inventoryLocations.id, { onDelete: "cascade" }),
    onHandQuantity: integer("on_hand_quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    allocatedQuantity: integer("allocated_quantity").notNull().default(0),
    availableQuantity: integer("available_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_levels_variant_idx").on(table.variantId),
    index("inventory_levels_location_idx").on(table.locationId),
    unique("inventory_levels_variant_location_unique").on(
      table.variantId,
      table.locationId,
    ),
  ],
)

/**
 * Inventory transactions - immutable ledger for the new inventory model.
 */
export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => inventoryLocations.id, { onDelete: "cascade" }),
    inventoryLevelId: uuid("inventory_level_id").references(
      () => inventoryLevels.id,
      {
        onDelete: "set null",
      },
    ),
    type: inventoryTransactionTypeEnum("type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    beforeOnHandQuantity: integer("before_on_hand_quantity").notNull(),
    afterOnHandQuantity: integer("after_on_hand_quantity").notNull(),
    beforeReservedQuantity: integer("before_reserved_quantity")
      .notNull()
      .default(0),
    afterReservedQuantity: integer("after_reserved_quantity")
      .notNull()
      .default(0),
    beforeAllocatedQuantity: integer("before_allocated_quantity")
      .notNull()
      .default(0),
    afterAllocatedQuantity: integer("after_allocated_quantity")
      .notNull()
      .default(0),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    notes: text("notes"),
    performedBy: uuid("performed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_transactions_variant_idx").on(table.variantId),
    index("inventory_transactions_location_idx").on(table.locationId),
    index("inventory_transactions_type_idx").on(table.type),
    index("inventory_transactions_reference_idx").on(
      table.referenceType,
      table.referenceId,
    ),
    index("inventory_transactions_created_at_idx").on(table.createdAt),
  ],
)

/**
 * Inventory units - one row per serialized physical unit.
 */
export const inventoryUnits = pgTable(
  "inventory_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => inventoryLocations.id, { onDelete: "cascade" }),
    status: inventoryUnitStatusEnum("status").notNull().default("received"),
    notes: text("notes"),
    allocatedOrderId: uuid("allocated_order_id"),
    allocatedOrderItemId: uuid("allocated_order_item_id"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    packedAt: timestamp("packed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_units_variant_idx").on(table.variantId),
    index("inventory_units_location_idx").on(table.locationId),
    index("inventory_units_status_idx").on(table.status),
    index("inventory_units_order_idx").on(
      table.allocatedOrderId,
      table.allocatedOrderItemId,
    ),
  ],
)

/**
 * Inventory unit identifiers - searchable unique identifiers such as serial,
 * IMEI, or barcode.
 */
export const inventoryUnitIdentifiers = pgTable(
  "inventory_unit_identifiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inventoryUnitId: uuid("inventory_unit_id")
      .notNull()
      .references(() => inventoryUnits.id, { onDelete: "cascade" }),
    type: inventoryIdentifierTypeEnum("type").notNull(),
    value: text("value").notNull(),
    normalizedValue: text("normalized_value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_unit_identifiers_value_idx").on(table.normalizedValue),
    unique("inventory_unit_identifiers_unit_type_unique").on(
      table.inventoryUnitId,
      table.type,
    ),
    unique("inventory_unit_identifiers_type_value_unique").on(
      table.type,
      table.normalizedValue,
    ),
  ],
)

// Relations
export const inventoryLocationsRelations = relations(
  inventoryLocations,
  ({ many }) => ({
    levels: many(inventoryLevels),
    units: many(inventoryUnits),
    transactions: many(inventoryTransactions),
  }),
)

export const inventoryLevelsRelations = relations(
  inventoryLevels,
  ({ one, many }) => ({
    variant: one(productVariants, {
      fields: [inventoryLevels.variantId],
      references: [productVariants.id],
    }),
    location: one(inventoryLocations, {
      fields: [inventoryLevels.locationId],
      references: [inventoryLocations.id],
    }),
    transactions: many(inventoryTransactions),
  }),
)

export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [inventoryTransactions.variantId],
      references: [productVariants.id],
    }),
    location: one(inventoryLocations, {
      fields: [inventoryTransactions.locationId],
      references: [inventoryLocations.id],
    }),
    level: one(inventoryLevels, {
      fields: [inventoryTransactions.inventoryLevelId],
      references: [inventoryLevels.id],
    }),
    performedByUser: one(user, {
      fields: [inventoryTransactions.performedBy],
      references: [user.id],
    }),
  }),
)

export const inventoryUnitsRelations = relations(
  inventoryUnits,
  ({ one, many }) => ({
    variant: one(productVariants, {
      fields: [inventoryUnits.variantId],
      references: [productVariants.id],
    }),
    location: one(inventoryLocations, {
      fields: [inventoryUnits.locationId],
      references: [inventoryLocations.id],
    }),
    identifiers: many(inventoryUnitIdentifiers),
  }),
)

export const inventoryUnitIdentifiersRelations = relations(
  inventoryUnitIdentifiers,
  ({ one }) => ({
    unit: one(inventoryUnits, {
      fields: [inventoryUnitIdentifiers.inventoryUnitId],
      references: [inventoryUnits.id],
    }),
  }),
)
