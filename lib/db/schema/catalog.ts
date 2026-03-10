import { relations } from "drizzle-orm"
import {
  type AnyPgColumn,
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

import { productStatusEnum } from "./enums"
import { inventoryItems } from "./inventory"

/**
 * Brands - First-class catalog brands.
 */
export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    logo: text("logo"),
    websiteUrl: text("website_url"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("brands_slug_idx").on(table.slug),
    index("brands_is_active_idx").on(table.isActive),
  ],
)

/**
 * Categories - Product categories with hierarchical support.
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    image: text("image"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
    index("categories_parent_id_idx").on(table.parentId),
  ],
)

/**
 * Products - Main product table.
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    shortDescription: text("short_description"),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    // Legacy single-category column kept for migration safety.
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    primaryCategoryId: uuid("primary_category_id").references(
      () => categories.id,
      {
        onDelete: "set null",
      },
    ),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    status: productStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_slug_idx").on(table.slug),
    index("products_brand_id_idx").on(table.brandId),
    index("products_category_id_idx").on(table.categoryId),
    index("products_primary_category_id_idx").on(table.primaryCategoryId),
    index("products_status_idx").on(table.status),
    index("products_is_featured_idx").on(table.isFeatured),
  ],
)

/**
 * Product category assignments - Many-to-many category membership.
 */
export const productCategoryAssignments = pgTable(
  "product_category_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_category_assignments_product_id_idx").on(table.productId),
    index("product_category_assignments_category_id_idx").on(table.categoryId),
    unique("product_category_assignments_unique").on(
      table.productId,
      table.categoryId,
    ),
  ],
)

/**
 * Product variants - Size, color, etc.
 * Each variant has its own SKU, price, and inventory.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(), // e.g., "Black / Large"
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    weight: decimal("weight", { precision: 10, scale: 3 }), // in kg
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_variants_product_id_idx").on(table.productId),
    index("product_variants_sku_idx").on(table.sku),
  ],
)

/**
 * Product images - Multiple images per product.
 */
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_images_product_id_idx").on(table.productId),
    index("product_images_variant_id_idx").on(table.variantId),
  ],
)

/**
 * Product attributes - Dynamic attributes like "Brand", "Model".
 */
export const productAttributes = pgTable("product_attributes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/**
 * Product attribute values - Values for attributes on specific products.
 */
export const productAttributeValues = pgTable(
  "product_attribute_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => productAttributes.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_attribute_values_product_id_idx").on(table.productId),
    index("product_attribute_values_attribute_id_idx").on(table.attributeId),
    unique("product_attribute_values_unique").on(
      table.productId,
      table.attributeId,
    ),
  ],
)

// Relations
export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  children: many(categories, {
    relationName: "categoryHierarchy",
  }),
  primaryProducts: many(products, {
    relationName: "productPrimaryCategory",
  }),
  productAssignments: many(productCategoryAssignments),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  primaryCategory: one(categories, {
    fields: [products.primaryCategoryId],
    references: [categories.id],
    relationName: "productPrimaryCategory",
  }),
  categoryAssignments: many(productCategoryAssignments),
  variants: many(productVariants),
  images: many(productImages),
  attributeValues: many(productAttributeValues),
}))

export const productCategoryAssignmentsRelations = relations(
  productCategoryAssignments,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategoryAssignments.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategoryAssignments.categoryId],
      references: [categories.id],
    }),
  }),
)

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    images: many(productImages),
    inventory: one(inventoryItems, {
      fields: [productVariants.id],
      references: [inventoryItems.variantId],
    }),
  }),
)

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}))

export const productAttributesRelations = relations(
  productAttributes,
  ({ many }) => ({
    values: many(productAttributeValues),
  }),
)

export const productAttributeValuesRelations = relations(
  productAttributeValues,
  ({ one }) => ({
    product: one(products, {
      fields: [productAttributeValues.productId],
      references: [products.id],
    }),
    attribute: one(productAttributes, {
      fields: [productAttributeValues.attributeId],
      references: [productAttributes.id],
    }),
  }),
)
