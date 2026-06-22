"use server"

import { revalidatePath } from "next/cache"

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

import { getVariantInventoryAvailabilityMap } from "@/lib/actions/inventory"
import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  brands,
  categories,
  models,
  productCategoryAssignments,
  productOptions,
  productOptionValues,
  products,
  productVariantOptionValues,
  productVariants,
} from "@/lib/db/schema"
import {
  type ReceiptIdentifierType,
  sanitizeReceiptIdentifierTypes,
} from "@/lib/inventory/identifier-template"
import {
  getPrimaryProductImageMap,
  getProductMedia as getProductMediaRecords,
} from "@/lib/media/service"
import {
  revalidateBrandCaches,
  revalidateCategoryCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

const productOptionInputSchema = z.object({
  name: z.string().min(1).max(100),
  affectsPricing: z.boolean().default(true),
  values: z.array(z.string().min(1).max(100)).default([]),
})

const inventoryIdentifierTypeSchema = z.enum([
  "serial",
  "imei",
  "imei2",
  "barcode",
])

const productVariantInputSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(1).max(100).optional(),
  name: z.string().max(255).optional(),
  price: z
    .string()
    .refine(
      (value) => !Number.isNaN(parseFloat(value)) && parseFloat(value) >= 0,
    ),
  compareAtPrice: z.string().optional().nullable(),
  costPrice: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  manageInventory: z.boolean().default(true),
  optionValues: z.record(z.string(), z.string()).default({}),
})

const productMutationInputSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  brandId: z.string().uuid().optional().nullable(),
  primaryCategoryId: z.string().uuid().optional().nullable(),
  modelId: z.string().uuid().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).default([]),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  draftStep: z
    .enum(["basics", "organization", "media", "options", "review"])
    .default("basics"),
  isFeatured: z.boolean().default(false),
  inventoryTrackingMode: z.enum(["quantity", "serial"]).default("quantity"),
  receiptIdentifierTypes: z.array(inventoryIdentifierTypeSchema).default([]),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  options: z.array(productOptionInputSchema).default([]),
  variants: z.array(productVariantInputSchema).min(1),
})

function createProductPublishValidationError(errors: string[]) {
  const error = new Error(
    errors[0] || "Product is not ready to publish",
  ) as Error & {
    publishErrors?: string[]
  }
  error.name = "ProductPublishValidationError"
  error.publishErrors = errors
  return error
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat("-", nanoid(6))
}

function generateSku(productName: string, variantName: string) {
  const prefix = productName.substring(0, 3).toUpperCase()
  const suffix = variantName.substring(0, 3).toUpperCase()
  return `${prefix}-${suffix}-${nanoid(6)}`.toUpperCase()
}

function createEmptyStorefrontProductsResult(page: number, limit: number) {
  return {
    products: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  }
}

function normalizeCategoryIds(
  primaryCategoryId: string | null,
  categoryIds: string[],
) {
  return Array.from(
    new Set(
      primaryCategoryId ? [primaryCategoryId, ...categoryIds] : categoryIds,
    ),
  )
}

function normalizeOptions(options: z.infer<typeof productOptionInputSchema>[]) {
  const seen = new Set<string>()

  return options
    .map((option) => ({
      name: option.name.trim(),
      affectsPricing: option.affectsPricing,
      values: Array.from(
        new Set(
          option.values
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
      ),
    }))
    .filter((option) => {
      const key = option.name.toLowerCase()

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return option.name.length > 0
    })
}

function validateProductInventoryConfiguration(
  input: z.infer<typeof productMutationInputSchema>,
) {
  const hasManagedInventoryVariants = input.variants.some(
    (variant) => variant.manageInventory,
  )
  const receiptIdentifierTypes = sanitizeReceiptIdentifierTypes({
    manageInventory: hasManagedInventoryVariants,
    trackingMode: input.inventoryTrackingMode,
    values: input.receiptIdentifierTypes,
  })

  if (!hasManagedInventoryVariants && receiptIdentifierTypes.length > 0) {
    throw new Error(
      "Receipt identifier types can only be configured when inventory is enabled for at least one variant",
    )
  }

  if (
    hasManagedInventoryVariants &&
    input.inventoryTrackingMode === "quantity" &&
    receiptIdentifierTypes.length > 0
  ) {
    throw new Error(
      "Quantity-tracked products cannot define serialized receipt identifier types",
    )
  }

  if (
    hasManagedInventoryVariants &&
    input.inventoryTrackingMode === "serial" &&
    receiptIdentifierTypes.length === 0
  ) {
    throw new Error(
      "Serialized tracking requires at least one receipt identifier type",
    )
  }
}

function normalizeVariants(
  variants: z.infer<typeof productVariantInputSchema>[],
  hasOptions: boolean,
) {
  const prepared = variants.map((variant, index) => ({
    ...variant,
    name: variant.name?.trim() || "",
    compareAtPrice: variant.compareAtPrice || null,
    costPrice: variant.costPrice || null,
    weight: variant.weight || null,
    optionValues: hasOptions ? variant.optionValues : {},
    isDefault: index === 0 ? variant.isDefault || true : variant.isDefault,
    manageInventory: variant.manageInventory,
  }))

  if (!prepared.some((variant) => variant.isDefault)) {
    prepared[0] = { ...prepared[0], isDefault: true }
  }

  let defaultSeen = false
  return prepared.map((variant) => {
    if (variant.isDefault && !defaultSeen) {
      defaultSeen = true
      return variant
    }

    return {
      ...variant,
      isDefault: false,
    }
  })
}

async function ensureCategoriesExist(categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return new Map<string, { id: string; slug: string; name: string }>()
  }

  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
    })
    .from(categories)
    .where(inArray(categories.id, categoryIds))

  if (rows.length !== categoryIds.length) {
    throw new Error("One or more categories do not exist")
  }

  return new Map(rows.map((row) => [row.id, row]))
}

async function ensureBrandExists(brandId: string | null | undefined) {
  if (!brandId) {
    return null
  }

  const [brand] = await db
    .select({
      id: brands.id,
      slug: brands.slug,
      name: brands.name,
    })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1)

  if (!brand) {
    throw new Error("Brand not found")
  }

  return brand
}

async function resolveModel(modelId: string | null | undefined) {
  if (!modelId) {
    return null
  }

  const [model] = await db
    .select({
      id: models.id,
      brandId: models.brandId,
      primaryCategoryId: models.primaryCategoryId,
      slug: models.slug,
      name: models.name,
      isActive: models.isActive,
    })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1)

  if (!model) {
    throw new Error("Model not found")
  }

  return model
}

async function validateProductOrganization(
  input: z.infer<typeof productMutationInputSchema>,
) {
  const resolvedModel = await resolveModel(input.modelId)

  if (
    resolvedModel &&
    input.brandId &&
    input.brandId !== resolvedModel.brandId
  ) {
    throw new Error("Selected model does not belong to the selected brand")
  }

  if (
    resolvedModel &&
    input.primaryCategoryId &&
    input.primaryCategoryId !== resolvedModel.primaryCategoryId
  ) {
    throw new Error(
      "Selected model does not belong to the selected primary category",
    )
  }

  const resolvedBrandId = resolvedModel
    ? resolvedModel.brandId
    : input.brandId || null
  const resolvedPrimaryCategoryId = resolvedModel
    ? resolvedModel.primaryCategoryId
    : input.primaryCategoryId || null

  if (resolvedBrandId) {
    await ensureBrandExists(resolvedBrandId)
  }

  if (resolvedPrimaryCategoryId) {
    await ensureCategoriesExist([resolvedPrimaryCategoryId])
  }

  const categoryIds = normalizeCategoryIds(
    resolvedPrimaryCategoryId,
    input.categoryIds,
  )

  await ensureCategoriesExist(categoryIds)

  if (input.status === "active") {
    if (!resolvedModel) {
      throw new Error("An active product must belong to a model")
    }

    if (!resolvedModel.isActive) {
      throw new Error("An active product cannot use an inactive model")
    }

    if (!resolvedBrandId || !resolvedPrimaryCategoryId) {
      throw new Error(
        "An active product must have a brand, primary category, and model",
      )
    }

    if (!categoryIds.includes(resolvedPrimaryCategoryId)) {
      throw new Error(
        "An active product must include its primary category in the assigned categories",
      )
    }
  }

  return {
    brandId: resolvedBrandId,
    primaryCategoryId: resolvedPrimaryCategoryId,
    modelId: resolvedModel?.id || null,
    categoryIds,
  }
}

async function resolveUniqueProductSlug(
  name: string,
  preferredSlug?: string,
  excludeProductId?: string,
) {
  const baseSlug = preferredSlug || generateSlug(name)
  let nextSlug = baseSlug
  let suffix = 2

  while (true) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, nextSlug))
      .limit(1)

    if (!existing || existing.id === excludeProductId) {
      return nextSlug
    }

    nextSlug = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

async function validateAndPrepareProductMutation(
  data: z.infer<typeof productMutationInputSchema>,
  options?: {
    existingProductId?: string
    existingProductSlug?: string
  },
) {
  const validated = productMutationInputSchema.parse(data)
  validateProductInventoryConfiguration(validated)
  const hasManagedInventoryVariants = validated.variants.some(
    (variant) => variant.manageInventory,
  )
  const receiptIdentifierTypes = sanitizeReceiptIdentifierTypes({
    manageInventory: hasManagedInventoryVariants,
    trackingMode: validated.inventoryTrackingMode,
    values: validated.receiptIdentifierTypes,
  }) as ReceiptIdentifierType[]

  const slug = await resolveUniqueProductSlug(
    validated.name,
    validated.slug || options?.existingProductSlug,
    options?.existingProductId,
  )
  const organization = await validateProductOrganization(validated)

  return {
    validated,
    organization,
    slug,
    inventoryTrackingMode: hasManagedInventoryVariants
      ? validated.inventoryTrackingMode
      : "quantity",
    receiptIdentifierTypes,
  }
}

async function getProductPublishReadiness(id: string) {
  const [product] = await db
    .select({
      id: products.id,
      brandId: products.brandId,
      primaryCategoryId: products.primaryCategoryId,
      modelId: products.modelId,
      status: products.status,
      inventoryTrackingMode: products.inventoryTrackingMode,
      receiptIdentifierTypes: products.receiptIdentifierTypes,
    })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!product) {
    throw new Error("Product not found")
  }

  const [assignedCategories, variants, modelRows] = await Promise.all([
    db
      .select({
        categoryId: productCategoryAssignments.categoryId,
        isPrimary: productCategoryAssignments.isPrimary,
      })
      .from(productCategoryAssignments)
      .where(eq(productCategoryAssignments.productId, id)),
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        manageInventory: productVariants.manageInventory,
      })
      .from(productVariants)
      .where(eq(productVariants.productId, id)),
    product.modelId
      ? db
          .select({
            id: models.id,
            isActive: models.isActive,
            brandId: models.brandId,
            primaryCategoryId: models.primaryCategoryId,
          })
          .from(models)
          .where(eq(models.id, product.modelId))
          .limit(1)
      : Promise.resolve(
          [] as Array<{
            id: string
            isActive: boolean
            brandId: string
            primaryCategoryId: string
          }>,
        ),
  ])

  const errors: string[] = []
  const primaryAssignments = assignedCategories.filter(
    (assignment) => assignment.isPrimary,
  )

  if (!product.brandId) {
    errors.push("Brand is required")
  }

  if (!product.primaryCategoryId) {
    errors.push("Primary category is required")
  }

  if (!product.modelId) {
    errors.push("Model is required")
  }

  if (assignedCategories.length === 0) {
    errors.push("At least one category assignment is required")
  }

  if (primaryAssignments.length !== 1) {
    errors.push("Exactly one assigned category must be marked primary")
  }

  if (
    product.primaryCategoryId &&
    !assignedCategories.some(
      (assignment) => assignment.categoryId === product.primaryCategoryId,
    )
  ) {
    errors.push("Primary category must exist in the assigned categories")
  }

  const model = modelRows[0]
  if (product.modelId && !model) {
    errors.push("Selected model could not be found")
  }

  if (model && !model.isActive) {
    errors.push("Selected model is inactive")
  }

  if (model && product.brandId && model.brandId !== product.brandId) {
    errors.push("Selected model is not compatible with the product brand")
  }

  if (
    model &&
    product.primaryCategoryId &&
    model.primaryCategoryId !== product.primaryCategoryId
  ) {
    errors.push(
      "Selected model is not compatible with the product primary category",
    )
  }

  if (variants.length === 0) {
    errors.push("At least one variant is required")
  }

  const skuSet = new Set<string>()
  const hasManagedInventoryVariants = variants.some(
    (variant) => variant.manageInventory,
  )

  for (const variant of variants) {
    const sku = variant.sku.trim()
    if (!sku) {
      errors.push("Every variant must have an SKU")
      continue
    }

    if (skuSet.has(sku)) {
      errors.push("Variant SKUs must be unique")
      break
    }

    skuSet.add(sku)

    if (
      !variant.manageInventory &&
      product.inventoryTrackingMode === "serial"
    ) {
      errors.push(
        "Serialized tracking cannot be used when inventory management is disabled",
      )
      break
    }
  }

  if (
    hasManagedInventoryVariants &&
    product.inventoryTrackingMode === "serial" &&
    (product.receiptIdentifierTypes?.length ?? 0) === 0
  ) {
    errors.push(
      "Serialized products must define at least one receipt identifier type",
    )
  }

  return {
    canPublish: errors.length === 0,
    errors,
  }
}

function assertDraftActivationUsesPublishEndpoint(
  nextStatus: z.infer<typeof productMutationInputSchema>["status"],
  existingStatus?: z.infer<typeof productMutationInputSchema>["status"],
) {
  if (nextStatus === "active" && existingStatus !== "active") {
    throw new Error("Use the publish endpoint to activate a product draft")
  }
}

async function getPrimaryImageMap(productIds: string[]) {
  return getPrimaryProductImageMap(productIds)
}

async function getAssignedCategories(productId: string) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      image: categories.image,
      metaTitle: categories.metaTitle,
      metaDescription: categories.metaDescription,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      showInProductMenu: categories.showInProductMenu,
      productMenuPriority: categories.productMenuPriority,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      isPrimary: productCategoryAssignments.isPrimary,
      assignmentSortOrder: productCategoryAssignments.sortOrder,
    })
    .from(productCategoryAssignments)
    .innerJoin(
      categories,
      eq(productCategoryAssignments.categoryId, categories.id),
    )
    .where(eq(productCategoryAssignments.productId, productId))
    .orderBy(
      desc(productCategoryAssignments.isPrimary),
      asc(productCategoryAssignments.sortOrder),
      asc(categories.sortOrder),
      asc(categories.name),
    )
}

async function getProductOptions(productId: string) {
  const options = await db
    .select({
      id: productOptions.id,
      name: productOptions.name,
      affectsPricing: productOptions.affectsPricing,
      sortOrder: productOptions.sortOrder,
    })
    .from(productOptions)
    .where(eq(productOptions.productId, productId))
    .orderBy(asc(productOptions.sortOrder), asc(productOptions.name))

  if (options.length === 0) {
    return []
  }

  const values = await db
    .select({
      id: productOptionValues.id,
      optionId: productOptionValues.optionId,
      value: productOptionValues.value,
      sortOrder: productOptionValues.sortOrder,
    })
    .from(productOptionValues)
    .where(
      inArray(
        productOptionValues.optionId,
        options.map((option) => option.id),
      ),
    )
    .orderBy(asc(productOptionValues.sortOrder), asc(productOptionValues.value))

  return options.map((option) => ({
    ...option,
    values: values.filter((value) => value.optionId === option.id),
  }))
}

async function getVariantsWithSelections(productId: string) {
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder))

  if (variants.length === 0) {
    return []
  }

  const [inventoryMap, selectionRows] = await Promise.all([
    getVariantInventoryAvailabilityMap(variants.map((variant) => variant.id)),
    db
      .select({
        variantId: productVariantOptionValues.variantId,
        optionId: productVariantOptionValues.optionId,
        optionName: productOptions.name,
        optionValueId: productVariantOptionValues.optionValueId,
        optionValue: productOptionValues.value,
      })
      .from(productVariantOptionValues)
      .innerJoin(
        productOptions,
        eq(productVariantOptionValues.optionId, productOptions.id),
      )
      .innerJoin(
        productOptionValues,
        eq(productVariantOptionValues.optionValueId, productOptionValues.id),
      )
      .where(
        inArray(
          productVariantOptionValues.variantId,
          variants.map((variant) => variant.id),
        ),
      ),
  ])

  return variants.map((variant) => ({
    ...variant,
    inventory: inventoryMap.get(variant.id) || null,
    selections: selectionRows
      .filter((selection) => selection.variantId === variant.id)
      .map((selection) => ({
        optionId: selection.optionId,
        optionName: selection.optionName,
        optionValueId: selection.optionValueId,
        optionValue: selection.optionValue,
      })),
  }))
}

async function syncProductCategories(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: string,
  categoryIds: string[],
  primaryCategoryId: string | null,
) {
  await tx
    .delete(productCategoryAssignments)
    .where(eq(productCategoryAssignments.productId, productId))

  if (categoryIds.length === 0) {
    return
  }

  await tx.insert(productCategoryAssignments).values(
    categoryIds.map((categoryId, index) => ({
      productId,
      categoryId,
      isPrimary: categoryId === primaryCategoryId,
      sortOrder: index,
    })),
  )
}

async function syncProductOptionsAndVariants(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: string,
  productName: string,
  optionsInput: z.infer<typeof productOptionInputSchema>[],
  variantsInput: z.infer<typeof productVariantInputSchema>[],
) {
  const normalizedOptions = normalizeOptions(optionsInput)
  const pricingOptions = normalizedOptions.filter(
    (option) => option.affectsPricing,
  )
  const normalizedVariants = normalizeVariants(
    variantsInput,
    pricingOptions.length > 0,
  )

  const existingOptions = await tx
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, productId))

  const optionIdsToKeep: string[] = []
  const optionMap = new Map<
    string,
    {
      id: string
      name: string
      values: Map<string, { id: string; value: string }>
    }
  >()

  for (
    let optionIndex = 0;
    optionIndex < normalizedOptions.length;
    optionIndex++
  ) {
    const option = normalizedOptions[optionIndex]
    const existingOption = existingOptions.find(
      (current) => current.name.toLowerCase() === option.name.toLowerCase(),
    )

    const optionRecord = existingOption
      ? (
          await tx
            .update(productOptions)
            .set({
              name: option.name,
              affectsPricing: option.affectsPricing,
              sortOrder: optionIndex,
              updatedAt: new Date(),
            })
            .where(eq(productOptions.id, existingOption.id))
            .returning()
        )[0]
      : (
          await tx
            .insert(productOptions)
            .values({
              productId,
              name: option.name,
              affectsPricing: option.affectsPricing,
              sortOrder: optionIndex,
            })
            .returning()
        )[0]

    optionIdsToKeep.push(optionRecord.id)

    const existingValues = await tx
      .select()
      .from(productOptionValues)
      .where(eq(productOptionValues.optionId, optionRecord.id))

    const valueMap = new Map<string, { id: string; value: string }>()
    const keepValueIds: string[] = []

    for (let valueIndex = 0; valueIndex < option.values.length; valueIndex++) {
      const value = option.values[valueIndex]
      const existingValue = existingValues.find(
        (current) => current.value.toLowerCase() === value.toLowerCase(),
      )

      const valueRecord = existingValue
        ? (
            await tx
              .update(productOptionValues)
              .set({
                value,
                sortOrder: valueIndex,
                updatedAt: new Date(),
              })
              .where(eq(productOptionValues.id, existingValue.id))
              .returning()
          )[0]
        : (
            await tx
              .insert(productOptionValues)
              .values({
                optionId: optionRecord.id,
                value,
                sortOrder: valueIndex,
              })
              .returning()
          )[0]

      keepValueIds.push(valueRecord.id)
      valueMap.set(value.toLowerCase(), {
        id: valueRecord.id,
        value: valueRecord.value,
      })
    }

    const valueIdsToDelete = existingValues
      .filter((value) => !keepValueIds.includes(value.id))
      .map((value) => value.id)

    if (valueIdsToDelete.length > 0) {
      await tx
        .delete(productOptionValues)
        .where(inArray(productOptionValues.id, valueIdsToDelete))
    }

    optionMap.set(option.name.toLowerCase(), {
      id: optionRecord.id,
      name: optionRecord.name,
      values: valueMap,
    })
  }

  const optionIdsToDelete = existingOptions
    .filter((option) => !optionIdsToKeep.includes(option.id))
    .map((option) => option.id)

  if (optionIdsToDelete.length > 0) {
    await tx
      .delete(productOptions)
      .where(inArray(productOptions.id, optionIdsToDelete))
  }

  const existingVariants = await tx
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))

  const keepVariantIds: string[] = []
  let defaultVariantId: string | null = null

  for (
    let variantIndex = 0;
    variantIndex < normalizedVariants.length;
    variantIndex++
  ) {
    const variant = normalizedVariants[variantIndex]

    if (pricingOptions.length > 0) {
      for (const option of pricingOptions) {
        const selectedValue = variant.optionValues[option.name]

        if (!selectedValue) {
          throw new Error(
            `Variant is missing a value for option "${option.name}"`,
          )
        }

        const optionRecord = optionMap.get(option.name.toLowerCase())

        if (!optionRecord?.values.has(selectedValue.toLowerCase())) {
          throw new Error(
            `Variant uses an unknown value "${selectedValue}" for option "${option.name}"`,
          )
        }
      }
    }

    const variantName =
      variant.name ||
      (pricingOptions.length > 0
        ? pricingOptions
            .map((option) => variant.optionValues[option.name] || "")
            .join(" / ")
        : "Default")

    const existingVariant = variant.id
      ? existingVariants.find((current) => current.id === variant.id)
      : undefined

    const sku =
      variant.sku ||
      existingVariant?.sku ||
      generateSku(productName, variantName)

    const [duplicate] = await tx
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.sku, sku))
      .limit(1)

    if (duplicate && duplicate.id !== existingVariant?.id) {
      throw new Error("A variant with this SKU already exists")
    }

    const variantRecord = existingVariant
      ? (
          await tx
            .update(productVariants)
            .set({
              sku,
              name: variantName,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              costPrice: variant.costPrice,
              weight: variant.weight,
              isDefault: variant.isDefault,
              isActive: variant.isActive,
              manageInventory: variant.manageInventory,
              sortOrder: variantIndex,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, existingVariant.id))
            .returning()
        )[0]
      : (
          await tx
            .insert(productVariants)
            .values({
              productId,
              sku,
              name: variantName,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              costPrice: variant.costPrice,
              weight: variant.weight,
              isDefault: variant.isDefault,
              isActive: variant.isActive,
              manageInventory: variant.manageInventory,
              sortOrder: variantIndex,
            })
            .returning()
        )[0]

    keepVariantIds.push(variantRecord.id)

    await tx
      .delete(productVariantOptionValues)
      .where(eq(productVariantOptionValues.variantId, variantRecord.id))

    if (pricingOptions.length > 0) {
      await tx.insert(productVariantOptionValues).values(
        pricingOptions.map((option) => {
          const optionRecord = optionMap.get(option.name.toLowerCase())!
          const optionValueRecord = optionRecord.values.get(
            variant.optionValues[option.name].toLowerCase(),
          )!

          return {
            variantId: variantRecord.id,
            optionId: optionRecord.id,
            optionValueId: optionValueRecord.id,
          }
        }),
      )
    }

    if (variant.isDefault) {
      defaultVariantId = variantRecord.id
    }
  }

  const variantsToDelete = existingVariants
    .filter((variant) => !keepVariantIds.includes(variant.id))
    .map((variant) => variant.id)

  if (variantsToDelete.length > 0) {
    await tx
      .delete(productVariants)
      .where(inArray(productVariants.id, variantsToDelete))
  }

  const currentVariants = await tx
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder))

  const resolvedDefaultVariant =
    currentVariants.find((variant) => variant.id === defaultVariantId) ||
    currentVariants.find((variant) => variant.isDefault) ||
    currentVariants[0]

  if (resolvedDefaultVariant) {
    await tx
      .update(products)
      .set({
        basePrice: resolvedDefaultVariant.price,
        compareAtPrice: resolvedDefaultVariant.compareAtPrice,
        costPrice: resolvedDefaultVariant.costPrice,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
  }
}

export async function getProducts(options?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  categoryId?: string
  brandId?: string
  modelId?: string
}) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit
  const conditions = []

  if (options?.search) {
    conditions.push(
      or(
        ilike(products.name, `%${options.search}%`),
        ilike(products.slug, `%${options.search}%`),
      )!,
    )
  }

  if (options?.status) {
    conditions.push(
      eq(products.status, options.status as "draft" | "active" | "archived"),
    )
  }

  if (options?.categoryId) {
    const productIds = await db
      .select({ productId: productCategoryAssignments.productId })
      .from(productCategoryAssignments)
      .where(eq(productCategoryAssignments.categoryId, options.categoryId))

    if (productIds.length === 0) {
      return {
        products: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    }

    conditions.push(
      inArray(
        products.id,
        productIds.map((row) => row.productId),
      ),
    )
  }

  if (options?.brandId) {
    conditions.push(eq(products.brandId, options.brandId))
  }

  if (options?.modelId) {
    conditions.push(eq(products.modelId, options.modelId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        status: products.status,
        draftStep: products.draftStep,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        brandId: products.brandId,
        brandName: brands.name,
        primaryCategoryId: products.primaryCategoryId,
        primaryCategoryName: categories.name,
        modelId: products.modelId,
        modelName: models.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.primaryCategoryId, categories.id))
      .leftJoin(models, eq(products.modelId, models.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause),
  ])

  return {
    products: rows,
    total: Number(countRows[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countRows[0]?.count || 0) / limit),
  }
}

export async function getProduct(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!product) {
    return null
  }

  const [
    brandRows,
    categoryRows,
    modelRows,
    assignedCategories,
    options,
    variants,
    media,
  ] = await Promise.all([
    product.brandId
      ? db.select().from(brands).where(eq(brands.id, product.brandId)).limit(1)
      : Promise.resolve([] as (typeof brands.$inferSelect)[]),
    product.primaryCategoryId
      ? db
          .select()
          .from(categories)
          .where(eq(categories.id, product.primaryCategoryId))
          .limit(1)
      : Promise.resolve([] as (typeof categories.$inferSelect)[]),
    product.modelId
      ? db.select().from(models).where(eq(models.id, product.modelId)).limit(1)
      : Promise.resolve([] as (typeof models.$inferSelect)[]),
    getAssignedCategories(product.id),
    getProductOptions(product.id),
    getVariantsWithSelections(product.id),
    getProductMediaRecords(product.id),
  ])

  const resolvedPrimaryCategory = categoryRows[0] || null
  const workflow = await getProductPublishReadiness(product.id)

  return {
    ...product,
    brand: brandRows[0] || null,
    primaryCategory: resolvedPrimaryCategory,
    category: resolvedPrimaryCategory,
    model: modelRows[0] || null,
    categories: assignedCategories,
    options,
    variants,
    media,
    workflow,
  }
}

export async function getProductBySlug(slug: string) {
  return withStorefrontCatalogFallback(
    "products:getProductBySlug",
    null,
    async () => {
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.status, "active")))
        .limit(1)

      if (!product) {
        return null
      }

      const [
        brandRows,
        categoryRows,
        modelRows,
        assignedCategories,
        options,
        variants,
        media,
      ] = await Promise.all([
        product.brandId
          ? db
              .select()
              .from(brands)
              .where(eq(brands.id, product.brandId))
              .limit(1)
          : Promise.resolve([] as (typeof brands.$inferSelect)[]),
        product.primaryCategoryId
          ? db
              .select()
              .from(categories)
              .where(eq(categories.id, product.primaryCategoryId))
              .limit(1)
          : Promise.resolve([] as (typeof categories.$inferSelect)[]),
        product.modelId
          ? db
              .select()
              .from(models)
              .where(eq(models.id, product.modelId))
              .limit(1)
          : Promise.resolve([] as (typeof models.$inferSelect)[]),
        getAssignedCategories(product.id),
        getProductOptions(product.id),
        getVariantsWithSelections(product.id),
        getProductMediaRecords(product.id),
      ])

      const resolvedPrimaryCategory = categoryRows[0] || null
      const workflow = await getProductPublishReadiness(product.id)

      return {
        ...product,
        brand: brandRows[0] || null,
        primaryCategory: resolvedPrimaryCategory,
        category: resolvedPrimaryCategory,
        model: modelRows[0] || null,
        categories: assignedCategories,
        options,
        variants,
        media,
        workflow,
      }
    },
  )
}

export async function getProductDraftReadiness(id: string) {
  await requireResourcePermission("product", "read")
  return getProductPublishReadiness(id)
}

export async function getStorefrontProducts(options?: {
  page?: number
  limit?: number
  categorySlug?: string
  brandSlug?: string
  modelId?: string
  modelSlug?: string
  primaryCategoryId?: string
  search?: string
  sortBy?: "newest" | "price-low" | "price-high" | "name"
  featured?: boolean
}) {
  const page = options?.page || 1
  const limit = options?.limit || 12
  const offset = (page - 1) * limit

  return withStorefrontCatalogFallback(
    "products:getStorefrontProducts",
    () => createEmptyStorefrontProductsResult(page, limit),
    async () => {
      const conditions = [eq(products.status, "active")]

      if (options?.primaryCategoryId) {
        conditions.push(
          eq(products.primaryCategoryId, options.primaryCategoryId),
        )
      }

      if (options?.search) {
        conditions.push(
          or(
            ilike(products.name, `%${options.search}%`),
            ilike(products.shortDescription, `%${options.search}%`),
          )!,
        )
      }

      if (options?.featured) {
        conditions.push(eq(products.isFeatured, true))
      }

      if (options?.brandSlug) {
        const [brand] = await db
          .select({ id: brands.id })
          .from(brands)
          .where(
            and(eq(brands.slug, options.brandSlug), eq(brands.isActive, true)),
          )
          .limit(1)

        if (!brand) {
          return createEmptyStorefrontProductsResult(page, limit)
        }

        conditions.push(eq(products.brandId, brand.id))
      }

      if (options?.modelSlug) {
        const [model] = await db
          .select({ id: models.id, isActive: models.isActive })
          .from(models)
          .where(eq(models.slug, options.modelSlug))
          .limit(1)

        if (!model || !model.isActive) {
          return createEmptyStorefrontProductsResult(page, limit)
        }

        conditions.push(eq(products.modelId, model.id))
      }

      if (options?.modelId) {
        conditions.push(eq(products.modelId, options.modelId))
      }

      if (options?.categorySlug) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(
            and(
              eq(categories.slug, options.categorySlug),
              eq(categories.isActive, true),
            ),
          )
          .limit(1)

        if (!category) {
          return createEmptyStorefrontProductsResult(page, limit)
        }

        const assignedRows = await db
          .select({ productId: productCategoryAssignments.productId })
          .from(productCategoryAssignments)
          .where(eq(productCategoryAssignments.categoryId, category.id))

        if (assignedRows.length === 0) {
          return createEmptyStorefrontProductsResult(page, limit)
        }

        conditions.push(
          inArray(
            products.id,
            assignedRows.map((row) => row.productId),
          ),
        )
      }

      const whereClause = and(...conditions)

      let orderBy
      switch (options?.sortBy) {
        case "price-low":
          orderBy = asc(products.basePrice)
          break
        case "price-high":
          orderBy = desc(products.basePrice)
          break
        case "name":
          orderBy = asc(products.name)
          break
        case "newest":
        default:
          orderBy = desc(products.createdAt)
      }

      const [rows, countRows] = await Promise.all([
        db
          .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            shortDescription: products.shortDescription,
            basePrice: products.basePrice,
            compareAtPrice: products.compareAtPrice,
            isFeatured: products.isFeatured,
            createdAt: products.createdAt,
            brand: {
              id: brands.id,
              name: brands.name,
              slug: brands.slug,
            },
            model: {
              id: models.id,
              name: models.name,
              slug: models.slug,
            },
          })
          .from(products)
          .leftJoin(brands, eq(products.brandId, brands.id))
          .leftJoin(models, eq(products.modelId, models.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(whereClause),
      ])

      const imageMap = await getPrimaryImageMap(
        rows.map((product) => product.id),
      )

      return {
        products: rows.map((product) => ({
          ...product,
          image: imageMap.get(product.id) || null,
        })),
        total: Number(countRows[0]?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countRows[0]?.count || 0) / limit),
      }
    },
  )
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productMutationInputSchema>,
) {
  await requireResourcePermission("product", "update")

  const [existingProduct] = await db
    .select({ id: products.id, slug: products.slug, status: products.status })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!existingProduct) {
    throw new Error("Product not found")
  }

  const {
    validated,
    organization,
    slug,
    inventoryTrackingMode,
    receiptIdentifierTypes,
  } = await validateAndPrepareProductMutation(data, {
    existingProductId: id,
    existingProductSlug: existingProduct.slug,
  })
  assertDraftActivationUsesPublishEndpoint(
    validated.status,
    existingProduct.status,
  )

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        name: validated.name,
        slug,
        description: validated.description || null,
        shortDescription: validated.shortDescription || null,
        brandId: organization.brandId,
        primaryCategoryId: organization.primaryCategoryId,
        modelId: organization.modelId,
        status: validated.status,
        draftStep: validated.draftStep,
        isFeatured: validated.isFeatured,
        inventoryTrackingMode,
        receiptIdentifierTypes,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))

    await syncProductCategories(
      tx,
      id,
      organization.categoryIds,
      organization.primaryCategoryId,
    )
    await syncProductOptionsAndVariants(
      tx,
      id,
      validated.name,
      validated.options,
      validated.variants,
    )
  })

  revalidatePath("/ops/products")
  revalidatePath(`/ops/products/${id}/edit`)
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return getProduct(id)
}

export async function createProduct(
  data: z.infer<typeof productMutationInputSchema>,
) {
  await requireResourcePermission("product", "create")
  const {
    validated,
    organization,
    slug,
    inventoryTrackingMode,
    receiptIdentifierTypes,
  } = await validateAndPrepareProductMutation(data)
  assertDraftActivationUsesPublishEndpoint(validated.status)

  const created = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(products)
      .values({
        name: validated.name,
        slug,
        description: validated.description || null,
        shortDescription: validated.shortDescription || null,
        brandId: organization.brandId,
        primaryCategoryId: organization.primaryCategoryId,
        modelId: organization.modelId,
        status: validated.status,
        draftStep: validated.draftStep,
        isFeatured: validated.isFeatured,
        inventoryTrackingMode,
        receiptIdentifierTypes,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
      })
      .returning({ id: products.id })

    await syncProductCategories(
      tx,
      inserted.id,
      organization.categoryIds,
      organization.primaryCategoryId,
    )
    await syncProductOptionsAndVariants(
      tx,
      inserted.id,
      validated.name,
      validated.options,
      validated.variants,
    )

    return inserted
  })

  revalidatePath("/ops/products")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return getProduct(created.id)
}

export async function publishProduct(id: string) {
  await requireResourcePermission("product", "update")

  const readiness = await getProductPublishReadiness(id)

  if (!readiness.canPublish) {
    throw createProductPublishValidationError(readiness.errors)
  }

  await db
    .update(products)
    .set({
      status: "active",
      draftStep: "review",
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))

  revalidatePath("/ops/products")
  revalidatePath(`/ops/products/${id}/edit`)
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return getProduct(id)
}

export async function deleteProduct(id: string) {
  await requireResourcePermission("product", "delete")

  await db.delete(products).where(eq(products.id, id))

  revalidatePath("/ops/products")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return { success: true as const }
}
