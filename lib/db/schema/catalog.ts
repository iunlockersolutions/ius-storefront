import { relations, sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  bigint,
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

import { user } from "./auth"
import {
  inventoryIdentifierTypeEnum,
  inventoryTrackingModeEnum,
  mediaAccessEnum,
  mediaDerivativeKindEnum,
  mediaKindEnum,
  mediaStatusEnum,
  mediaStorageProviderEnum,
  productDraftStepEnum,
  productStatusEnum,
} from "./enums"
import { inventoryLevels } from "./inventory"

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
 * Category option templates - Reusable option names suggested for products
 * assigned to a category.
 */
export const categoryOptionTemplates = pgTable(
  "category_option_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("category_option_templates_category_id_idx").on(table.categoryId),
    index("category_option_templates_normalized_name_idx").on(
      table.normalizedName,
    ),
    unique("category_option_templates_category_name_unique").on(
      table.categoryId,
      table.normalizedName,
    ),
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
    draftStep: productDraftStepEnum("draft_step").notNull().default("basics"),
    isFeatured: boolean("is_featured").notNull().default(false),
    inventoryTrackingMode: inventoryTrackingModeEnum("inventory_tracking_mode")
      .notNull()
      .default("quantity"),
    receiptIdentifierTypes: inventoryIdentifierTypeEnum(
      "receipt_identifier_types",
    )
      .array()
      .$type<Array<"serial" | "imei" | "imei2" | "barcode">>()
      .notNull()
      .default(sql`ARRAY[]::inventory_identifier_type[]`),
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
    index("products_draft_step_idx").on(table.draftStep),
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
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
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
    manageInventory: boolean("manage_inventory").notNull().default(true),
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
 * Media assets - Provider-neutral source records for uploaded images/videos.
 */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: mediaStorageProviderEnum("provider")
      .notNull()
      .default("vercel_blob"),
    access: mediaAccessEnum("access").notNull().default("public"),
    kind: mediaKindEnum("kind").notNull(),
    status: mediaStatusEnum("status").notNull().default("ready"),
    pathname: text("pathname").notNull().unique(),
    url: text("url").notNull(),
    downloadUrl: text("download_url"),
    mimeType: text("mime_type").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    etag: text("etag"),
    originalFilename: text("original_filename").notNull(),
    placeholderDataUrl: text("placeholder_data_url"),
    createdBy: uuid("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("media_assets_provider_idx").on(table.provider),
    index("media_assets_access_idx").on(table.access),
    index("media_assets_kind_idx").on(table.kind),
    index("media_assets_status_idx").on(table.status),
    index("media_assets_created_by_idx").on(table.createdBy),
  ],
)

/**
 * Media derivatives - Generated artifacts such as blur images and posters.
 */
export const mediaDerivatives = pgTable(
  "media_derivatives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    kind: mediaDerivativeKindEnum("kind").notNull(),
    pathname: text("pathname").notNull().unique(),
    url: text("url").notNull(),
    downloadUrl: text("download_url"),
    mimeType: text("mime_type").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("media_derivatives_media_asset_id_idx").on(table.mediaAssetId),
    unique("media_derivatives_media_asset_kind_unique").on(
      table.mediaAssetId,
      table.kind,
    ),
  ],
)

/**
 * Product media - Product-specific presentation metadata for uploaded assets.
 */
export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    appliesToAllVariants: boolean("applies_to_all_variants")
      .notNull()
      .default(true),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimaryImage: boolean("is_primary_image").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_media_product_id_idx").on(table.productId),
    index("product_media_media_asset_id_idx").on(table.mediaAssetId),
    unique("product_media_product_media_asset_unique").on(
      table.productId,
      table.mediaAssetId,
    ),
  ],
)

export const productMediaVariantAssignments = pgTable(
  "product_media_variant_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productMediaId: uuid("product_media_id")
      .notNull()
      .references(() => productMedia.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_media_variant_assignments_media_id_idx").on(
      table.productMediaId,
    ),
    index("product_media_variant_assignments_variant_id_idx").on(
      table.variantId,
    ),
    unique("product_media_variant_assignments_unique").on(
      table.productMediaId,
      table.variantId,
    ),
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
  optionTemplates: many(categoryOptionTemplates),
  models: many(models),
  primaryProducts: many(products, {
    relationName: "productPrimaryCategory",
  }),
  productAssignments: many(productCategoryAssignments),
}))

export const categoryOptionTemplatesRelations = relations(
  categoryOptionTemplates,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoryOptionTemplates.categoryId],
      references: [categories.id],
    }),
  }),
)

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
  media: many(productMedia),
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
    mediaAssignments: many(productMediaVariantAssignments),
    levels: many(inventoryLevels),
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

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [mediaAssets.createdBy],
    references: [user.id],
  }),
  derivatives: many(mediaDerivatives),
  productMedia: many(productMedia),
}))

export const mediaDerivativesRelations = relations(
  mediaDerivatives,
  ({ one }) => ({
    mediaAsset: one(mediaAssets, {
      fields: [mediaDerivatives.mediaAssetId],
      references: [mediaAssets.id],
    }),
  }),
)

export const productMediaRelations = relations(
  productMedia,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productMedia.productId],
      references: [products.id],
    }),
    mediaAsset: one(mediaAssets, {
      fields: [productMedia.mediaAssetId],
      references: [mediaAssets.id],
    }),
    variantAssignments: many(productMediaVariantAssignments),
  }),
)

export const productMediaVariantAssignmentsRelations = relations(
  productMediaVariantAssignments,
  ({ one }) => ({
    productMedia: one(productMedia, {
      fields: [productMediaVariantAssignments.productMediaId],
      references: [productMedia.id],
    }),
    variant: one(productVariants, {
      fields: [productMediaVariantAssignments.variantId],
      references: [productVariants.id],
    }),
  }),
)

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
