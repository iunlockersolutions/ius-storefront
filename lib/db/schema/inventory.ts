import { relations } from "drizzle-orm"
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"
import { productVariants } from "./catalog"
import { inventoryMovementTypeEnum } from "./enums"

/**
 * Inventory items - Current stock levels per variant.
 * This is the computed state; movements are the source of truth.
 */
export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .unique()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").default(5),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("inventory_items_variant_id_idx").on(table.variantId)],
)

/**
 * Inventory movements - Ledger for all stock changes.
 * Every stock change creates a movement record for auditability.
 */
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    type: inventoryMovementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(), // Positive for additions, negative for deductions
    previousQuantity: integer("previous_quantity").notNull(),
    newQuantity: integer("new_quantity").notNull(),
    referenceType: text("reference_type"), // 'order', 'adjustment', etc.
    referenceId: uuid("reference_id"), // ID of the related entity
    notes: text("notes"),
    performedBy: uuid("performed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_movements_inventory_item_id_idx").on(
      table.inventoryItemId,
    ),
    index("inventory_movements_type_idx").on(table.type),
    index("inventory_movements_reference_idx").on(
      table.referenceType,
      table.referenceId,
    ),
    index("inventory_movements_created_at_idx").on(table.createdAt),
  ],
)

// Relations
export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    variant: one(productVariants, {
      fields: [inventoryItems.variantId],
      references: [productVariants.id],
    }),
    movements: many(inventoryMovements),
  }),
)

export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    inventoryItem: one(inventoryItems, {
      fields: [inventoryMovements.inventoryItemId],
      references: [inventoryItems.id],
    }),
    performedByUser: one(user, {
      fields: [inventoryMovements.performedBy],
      references: [user.id],
    }),
  }),
)
