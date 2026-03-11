"use server"

import { revalidatePath } from "next/cache"

import { and, asc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  brandCategoryAssignments,
  brands,
  categories,
  models,
  products,
} from "@/lib/db/schema"
import { slugify } from "@/lib/utils"
import {
  revalidateBrandCaches,
  revalidateCategoryCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

const modelSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  brandId: z.string().uuid(),
  primaryCategoryId: z.string().uuid(),
  showInProductMenu: z.boolean().default(true),
  navPriority: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

async function ensureTopLevelCategory(categoryId: string) {
  const [category] = await db
    .select({
      id: categories.id,
      parentId: categories.parentId,
      slug: categories.slug,
      name: categories.name,
    })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1)

  if (!category) {
    throw new Error("Category not found")
  }

  if (category.parentId) {
    throw new Error("Models must use a top-level primary category")
  }

  return category
}

async function ensureBrand(brandId: string) {
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

async function ensureBrandAssignedToCategory(
  brandId: string,
  categoryId: string,
) {
  const [assignment] = await db
    .select({ id: brandCategoryAssignments.id })
    .from(brandCategoryAssignments)
    .where(
      and(
        eq(brandCategoryAssignments.brandId, brandId),
        eq(brandCategoryAssignments.categoryId, categoryId),
      ),
    )
    .limit(1)

  if (!assignment) {
    throw new Error(
      "This brand is not assigned to the selected primary category",
    )
  }
}

export async function getModels(options?: {
  brandId?: string
  primaryCategoryId?: string
  includeInactive?: boolean
}) {
  const conditions = []

  if (options?.brandId) {
    conditions.push(eq(models.brandId, options.brandId))
  }

  if (options?.primaryCategoryId) {
    conditions.push(eq(models.primaryCategoryId, options.primaryCategoryId))
  }

  if (!options?.includeInactive) {
    conditions.push(eq(models.isActive, true))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const priorityGroup = sql<number>`case when ${models.navPriority} > 0 then 0 else 1 end`

  return db
    .select({
      id: models.id,
      name: models.name,
      slug: models.slug,
      description: models.description,
      brandId: models.brandId,
      brandName: brands.name,
      primaryCategoryId: models.primaryCategoryId,
      primaryCategoryName: categories.name,
      showInProductMenu: models.showInProductMenu,
      navPriority: models.navPriority,
      isActive: models.isActive,
      productCount: sql<number>`(
        select count(*)::int
        from "products"
        where "products"."model_id" = "models"."id"
      )`,
    })
    .from(models)
    .innerJoin(brands, eq(models.brandId, brands.id))
    .innerJoin(categories, eq(models.primaryCategoryId, categories.id))
    .where(whereClause)
    .orderBy(
      asc(priorityGroup),
      asc(models.navPriority),
      asc(categories.productMenuPriority),
      asc(categories.sortOrder),
      asc(brands.sortOrder),
      asc(models.name),
    )
}

export async function getModel(id: string) {
  const [model] = await db
    .select({
      id: models.id,
      name: models.name,
      slug: models.slug,
      description: models.description,
      brandId: models.brandId,
      brandName: brands.name,
      primaryCategoryId: models.primaryCategoryId,
      primaryCategoryName: categories.name,
      showInProductMenu: models.showInProductMenu,
      navPriority: models.navPriority,
      isActive: models.isActive,
      productCount: sql<number>`(
        select count(*)::int
        from "products"
        where "products"."model_id" = "models"."id"
      )`,
    })
    .from(models)
    .innerJoin(brands, eq(models.brandId, brands.id))
    .innerJoin(categories, eq(models.primaryCategoryId, categories.id))
    .where(eq(models.id, id))
    .limit(1)

  return model || null
}

export async function getModelBySlug(slug: string) {
  return withStorefrontCatalogFallback("models:getBySlug", null, async () => {
    const [model] = await db
      .select({
        id: models.id,
        name: models.name,
        slug: models.slug,
        description: models.description,
        brandId: models.brandId,
        brandName: brands.name,
        brandSlug: brands.slug,
        primaryCategoryId: models.primaryCategoryId,
        primaryCategoryName: categories.name,
        primaryCategorySlug: categories.slug,
        showInProductMenu: models.showInProductMenu,
        navPriority: models.navPriority,
        isActive: models.isActive,
      })
      .from(models)
      .innerJoin(brands, eq(models.brandId, brands.id))
      .innerJoin(categories, eq(models.primaryCategoryId, categories.id))
      .where(and(eq(models.slug, slug), eq(models.isActive, true)))
      .limit(1)

    return model || null
  })
}

export async function getRelatedModels(modelId: string) {
  const [model] = await db
    .select({
      id: models.id,
      brandId: models.brandId,
      primaryCategoryId: models.primaryCategoryId,
    })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1)

  if (!model) {
    return []
  }

  const priorityGroup = sql<number>`case when ${models.navPriority} > 0 then 0 else 1 end`

  return db
    .select({
      id: models.id,
      name: models.name,
      slug: models.slug,
    })
    .from(models)
    .where(
      and(
        eq(models.brandId, model.brandId),
        eq(models.primaryCategoryId, model.primaryCategoryId),
        eq(models.isActive, true),
      ),
    )
    .orderBy(asc(priorityGroup), asc(models.navPriority), asc(models.name))
}

export async function createModel(data: z.infer<typeof modelSchema>) {
  await requireResourcePermission("product", "create")
  const validated = modelSchema.parse(data)
  const category = await ensureTopLevelCategory(validated.primaryCategoryId)
  const brand = await ensureBrand(validated.brandId)
  await ensureBrandAssignedToCategory(
    validated.brandId,
    validated.primaryCategoryId,
  )

  const slug =
    validated.slug ||
    `${category.slug}-${brand.slug}-${slugify(validated.name)}`.slice(0, 255)

  const [existing] = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.slug, slug))
    .limit(1)

  if (existing) {
    throw new Error("A model with this slug already exists")
  }

  const [model] = await db
    .insert(models)
    .values({
      name: validated.name,
      slug,
      description: validated.description || null,
      brandId: validated.brandId,
      primaryCategoryId: validated.primaryCategoryId,
      showInProductMenu: validated.showInProductMenu,
      navPriority: validated.navPriority,
      isActive: validated.isActive,
    })
    .returning()

  revalidatePath("/ops/models")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return model
}

export async function updateModel(
  id: string,
  data: z.infer<typeof modelSchema>,
) {
  await requireResourcePermission("product", "update")
  const validated = modelSchema.parse(data)
  const category = await ensureTopLevelCategory(validated.primaryCategoryId)
  const brand = await ensureBrand(validated.brandId)
  await ensureBrandAssignedToCategory(
    validated.brandId,
    validated.primaryCategoryId,
  )

  const slug =
    validated.slug ||
    `${category.slug}-${brand.slug}-${slugify(validated.name)}`.slice(0, 255)

  const [existing] = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.slug, slug))
    .limit(1)

  if (existing && existing.id !== id) {
    throw new Error("A model with this slug already exists")
  }

  const linkedProducts = await db
    .select({
      id: products.id,
      status: products.status,
    })
    .from(products)
    .where(eq(products.modelId, id))

  if (
    linkedProducts.some((product) => product.status === "active") &&
    linkedProducts.length > 0
  ) {
    const [currentModel] = await db
      .select({
        brandId: models.brandId,
        primaryCategoryId: models.primaryCategoryId,
      })
      .from(models)
      .where(eq(models.id, id))
      .limit(1)

    if (
      currentModel &&
      (currentModel.brandId !== validated.brandId ||
        currentModel.primaryCategoryId !== validated.primaryCategoryId)
    ) {
      throw new Error(
        "Cannot change brand or primary category while active products are linked to this model",
      )
    }
  }

  const [model] = await db
    .update(models)
    .set({
      name: validated.name,
      slug,
      description: validated.description || null,
      brandId: validated.brandId,
      primaryCategoryId: validated.primaryCategoryId,
      showInProductMenu: validated.showInProductMenu,
      navPriority: validated.navPriority,
      isActive: validated.isActive,
      updatedAt: new Date(),
    })
    .where(eq(models.id, id))
    .returning()

  if (!model) {
    throw new Error("Model not found")
  }

  revalidatePath("/ops/models")
  revalidatePath(`/ops/models/${id}`)
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return model
}

export async function deleteModel(id: string) {
  await requireResourcePermission("product", "delete")

  const [linkedProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.modelId, id))
    .limit(1)

  if (linkedProduct) {
    throw new Error(
      "Cannot delete a model that is assigned to products. Reassign or delete those products first.",
    )
  }

  await db.delete(models).where(eq(models.id, id))

  revalidatePath("/ops/models")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return { success: true as const }
}
