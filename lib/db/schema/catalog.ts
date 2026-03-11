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
    normalizedName: text("normalized_name").notNull(),
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
    index("brands_normalized_name_idx").on(table.normalizedName),
    index("brands_is_active_idx").on(table.isActive),
    unique("brands_normalized_name_unique").on(table.normalizedName),
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
    showInProductMenu: boolean("show_in_product_menu").notNull().default(true),
    productMenuPriority: integer("product_menu_priority").notNull().default(0),
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
 * Brand category assignments - Catalog relationship and navbar configuration
 * for brands within top-level categories.
 */
export const brandCategoryAssignments = pgTable(
  "brand_category_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    showInProductMenu: boolean("show_in_product_menu").notNull().default(true),
    navPriority: integer("nav_priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("brand_category_assignments_brand_id_idx").on(table.brandId),
    index("brand_category_assignments_category_id_idx").on(table.categoryId),
    unique("brand_category_assignments_unique").on(
      table.brandId,
      table.categoryId,
    ),
  ],
)

/**
 * Models - Brand/category scoped product families used by the product menu and
 * model landing pages.
 */
export const models = pgTable(
  "models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    primaryCategoryId: uuid("primary_category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isActive: boolean("is_active").notNull().default(true),
    showInProductMenu: boolean("show_in_product_menu").notNull().default(true),
    navPriority: integer("nav_priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("models_brand_id_idx").on(table.brandId),
    index("models_primary_category_id_idx").on(table.primaryCategoryId),
    index("models_normalized_name_idx").on(table.normalizedName),
    index("models_slug_idx").on(table.slug),
    unique("models_brand_category_normalized_name_unique").on(
      table.brandId,
      table.primaryCategoryId,
      table.normalizedName,
    ),
  ],
)

/**
 * Products - Sellable catalog listings under a model. Pricing is denormalized
 * from the default variant for fast storefront queries, but variants remain the
 * source of truth for purchase/inventory.
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
    primaryCategoryId: uuid("primary_category_id").references(
      () => categories.id,
      {
        onDelete: "set null",
      },
    ),
    modelId: uuid("model_id").references(() => models.id, {
      onDelete: "set null",
    }),
    basePrice: decimal("base_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
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
    index("products_primary_category_id_idx").on(table.primaryCategoryId),
    index("products_model_id_idx").on(table.modelId),
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
 * Product options - Variant dimensions like Storage or Color.
 */
export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_options_product_id_idx").on(table.productId),
    unique("product_options_product_name_unique").on(
      table.productId,
      table.name,
    ),
  ],
)

/**
 * Product option values - Allowed values for a given option.
 */
export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    optionId: uuid("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_option_values_option_id_idx").on(table.optionId),
    unique("product_option_values_option_value_unique").on(
      table.optionId,
      table.value,
    ),
  ],
)

/**
 * Product variants - Sellable SKUs with price and inventory.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    weight: decimal("weight", { precision: 10, scale: 3 }),
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
 * Product variant option values - Selected value per option on a variant.
 */
export const productVariantOptionValues = pgTable(
  "product_variant_option_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_variant_option_values_variant_id_idx").on(table.variantId),
    index("product_variant_option_values_option_id_idx").on(table.optionId),
    index("product_variant_option_values_option_value_id_idx").on(
      table.optionValueId,
    ),
    unique("product_variant_option_values_variant_option_unique").on(
      table.variantId,
      table.optionId,
    ),
  ],
)

/**
 * Product images - Multiple images per product or variant.
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
 * Product attributes - Dynamic attributes like "Brand" or "Warranty".
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

export const brandsRelations = relations(brands, ({ many }) => ({
  brandCategoryAssignments: many(brandCategoryAssignments),
  models: many(models),
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
  brandAssignments: many(brandCategoryAssignments),
  models: many(models),
  primaryProducts: many(products, {
    relationName: "productPrimaryCategory",
  }),
  productAssignments: many(productCategoryAssignments),
}))

export const brandCategoryAssignmentsRelations = relations(
  brandCategoryAssignments,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandCategoryAssignments.brandId],
      references: [brands.id],
    }),
    category: one(categories, {
      fields: [brandCategoryAssignments.categoryId],
      references: [categories.id],
    }),
  }),
)

export const modelsRelations = relations(models, ({ one, many }) => ({
  brand: one(brands, {
    fields: [models.brandId],
    references: [brands.id],
  }),
  primaryCategory: one(categories, {
    fields: [models.primaryCategoryId],
    references: [categories.id],
  }),
  products: many(products),
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
  model: one(models, {
    fields: [products.modelId],
    references: [models.id],
  }),
  categoryAssignments: many(productCategoryAssignments),
  options: many(productOptions),
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

export const productOptionsRelations = relations(
  productOptions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productOptions.productId],
      references: [products.id],
    }),
    values: many(productOptionValues),
    variantSelections: many(productVariantOptionValues),
  }),
)

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ one, many }) => ({
    option: one(productOptions, {
      fields: [productOptionValues.optionId],
      references: [productOptions.id],
    }),
    variantSelections: many(productVariantOptionValues),
  }),
)

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    optionSelections: many(productVariantOptionValues),
    images: many(productImages),
    inventory: one(inventoryItems, {
      fields: [productVariants.id],
      references: [inventoryItems.variantId],
    }),
  }),
)

export const productVariantOptionValuesRelations = relations(
  productVariantOptionValues,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [productVariantOptionValues.variantId],
      references: [productVariants.id],
    }),
    option: one(productOptions, {
      fields: [productVariantOptionValues.optionId],
      references: [productOptions.id],
    }),
    optionValue: one(productOptionValues, {
      fields: [productVariantOptionValues.optionValueId],
      references: [productOptionValues.id],
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
