"use server"

import { revalidatePath } from "next/cache"

import { asc, eq, inArray, sql } from "drizzle-orm"
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
import {
  revalidateBrandCaches,
  revalidateCategoryCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

const brandCategoryAssignmentSchema = z.object({
  categoryId: z.string().uuid(),
  navPriority: z.number().int().default(0),
  showInProductMenu: z.boolean().default(true),
})

const brandSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  logo: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  categoryAssignments: z.array(brandCategoryAssignmentSchema).default([]),
})

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeAssignments(
  assignments: z.infer<typeof brandCategoryAssignmentSchema>[],
) {
  const seen = new Set<string>()

  return assignments.filter((assignment) => {
    if (seen.has(assignment.categoryId)) {
      return false
    }

    seen.add(assignment.categoryId)
    return true
  })
}

async function ensureTopLevelCategories(categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return
  }

  const rows = await db
    .select({
      id: categories.id,
      parentId: categories.parentId,
    })
    .from(categories)
    .where(inArray(categories.id, categoryIds))

  if (rows.length !== categoryIds.length) {
    throw new Error("One or more assigned categories do not exist")
  }

  if (rows.some((category) => category.parentId !== null)) {
    throw new Error("Brands can only be assigned to top-level categories")
  }
}

async function getBrandAssignmentsMap(brandIds: string[]) {
  if (brandIds.length === 0) {
    return new Map<
      string,
      Array<{
        categoryId: string
        categoryName: string
        categorySlug: string
        navPriority: number
        showInProductMenu: boolean
      }>
    >()
  }

  const rows = await db
    .select({
      brandId: brandCategoryAssignments.brandId,
      categoryId: brandCategoryAssignments.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      navPriority: brandCategoryAssignments.navPriority,
      showInProductMenu: brandCategoryAssignments.showInProductMenu,
    })
    .from(brandCategoryAssignments)
    .innerJoin(
      categories,
      eq(brandCategoryAssignments.categoryId, categories.id),
    )
    .where(inArray(brandCategoryAssignments.brandId, brandIds))
    .orderBy(
      asc(brandCategoryAssignments.navPriority),
      asc(categories.productMenuPriority),
      asc(categories.sortOrder),
      asc(categories.name),
    )

  const map = new Map<
    string,
    Array<{
      categoryId: string
      categoryName: string
      categorySlug: string
      navPriority: number
      showInProductMenu: boolean
    }>
  >()

  for (const row of rows) {
    const current = map.get(row.brandId) ?? []
    current.push({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categorySlug: row.categorySlug,
      navPriority: row.navPriority,
      showInProductMenu: row.showInProductMenu,
    })
    map.set(row.brandId, current)
  }

  return map
}

async function syncBrandCategoryAssignments(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  brandId: string,
  assignments: z.infer<typeof brandCategoryAssignmentSchema>[],
) {
  await tx
    .delete(brandCategoryAssignments)
    .where(eq(brandCategoryAssignments.brandId, brandId))

  if (assignments.length === 0) {
    return
  }

  await tx.insert(brandCategoryAssignments).values(
    assignments.map((assignment) => ({
      brandId,
      categoryId: assignment.categoryId,
      navPriority: assignment.navPriority,
      showInProductMenu: assignment.showInProductMenu,
    })),
  )
}

export async function getBrands() {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logo: brands.logo,
      websiteUrl: brands.websiteUrl,
      isActive: brands.isActive,
      sortOrder: brands.sortOrder,
      metaTitle: brands.metaTitle,
      metaDescription: brands.metaDescription,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
      productCount: sql<number>`(
        select count(*)::int
        from "products"
        where "products"."brand_id" = "brands"."id"
      )`,
      modelCount: sql<number>`(
        select count(*)::int
        from "models"
        where "models"."brand_id" = "brands"."id"
      )`,
    })
    .from(brands)
    .orderBy(asc(brands.sortOrder), asc(brands.name))

  const assignmentsMap = await getBrandAssignmentsMap(
    rows.map((brand) => brand.id),
  )

  return rows.map((brand) => ({
    ...brand,
    categoryAssignments: assignmentsMap.get(brand.id) ?? [],
  }))
}

export async function getActiveBrands(options?: { failSoft?: boolean }) {
  const read = async () => {
    const rows = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        description: brands.description,
        logo: brands.logo,
        websiteUrl: brands.websiteUrl,
        isActive: brands.isActive,
        sortOrder: brands.sortOrder,
        metaTitle: brands.metaTitle,
        metaDescription: brands.metaDescription,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
        productCount: sql<number>`(
          select count(*)::int
          from "products"
          where "products"."brand_id" = "brands"."id"
            and "products"."status" = 'active'
        )`,
      })
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(asc(brands.sortOrder), asc(brands.name))

    const assignmentsMap = await getBrandAssignmentsMap(
      rows.map((brand) => brand.id),
    )

    return rows.map((brand) => ({
      ...brand,
      categoryAssignments: assignmentsMap.get(brand.id) ?? [],
    }))
  }

  if (options?.failSoft) {
    return withStorefrontCatalogFallback("brands:getActiveBrands", [], read)
  }

  return read()
}

export async function getBrand(id: string) {
  const [brand] = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logo: brands.logo,
      websiteUrl: brands.websiteUrl,
      isActive: brands.isActive,
      sortOrder: brands.sortOrder,
      metaTitle: brands.metaTitle,
      metaDescription: brands.metaDescription,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
      productCount: sql<number>`(
        select count(*)::int
        from "products"
        where "products"."brand_id" = "brands"."id"
      )`,
      modelCount: sql<number>`(
        select count(*)::int
        from "models"
        where "models"."brand_id" = "brands"."id"
      )`,
    })
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1)

  if (!brand) {
    return null
  }

  const assignmentsMap = await getBrandAssignmentsMap([brand.id])
  return {
    ...brand,
    categoryAssignments: assignmentsMap.get(brand.id) ?? [],
  }
}

export async function getBrandBySlug(slug: string) {
  return withStorefrontCatalogFallback(
    "brands:getBrandBySlug",
    null,
    async () => {
      const [brand] = await db
        .select({
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
          description: brands.description,
          logo: brands.logo,
          websiteUrl: brands.websiteUrl,
          isActive: brands.isActive,
          sortOrder: brands.sortOrder,
          metaTitle: brands.metaTitle,
          metaDescription: brands.metaDescription,
          createdAt: brands.createdAt,
          updatedAt: brands.updatedAt,
          productCount: sql<number>`(
            select count(*)::int
            from "products"
            where "products"."brand_id" = "brands"."id"
              and "products"."status" = 'active'
          )`,
        })
        .from(brands)
        .where(eq(brands.slug, slug))
        .limit(1)

      if (!brand || !brand.isActive) {
        return null
      }

      return brand
    },
  )
}

export async function createBrand(data: z.infer<typeof brandSchema>) {
  try {
    await requireResourcePermission("brand", "create")
    const validated = brandSchema.parse(data)
    const slug = validated.slug || generateSlug(validated.name)
    const assignments = normalizeAssignments(validated.categoryAssignments)

    const [existing] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1)

    if (existing) {
      return {
        success: false as const,
        error: "A brand with this slug already exists",
      }
    }

    await ensureTopLevelCategories(assignments.map((item) => item.categoryId))

    const brand = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(brands)
        .values({
          name: validated.name,
          slug,
          description: validated.description || null,
          logo: validated.logo || null,
          websiteUrl: validated.websiteUrl || null,
          isActive: validated.isActive,
          sortOrder: validated.sortOrder,
          metaTitle: validated.metaTitle || null,
          metaDescription: validated.metaDescription || null,
        })
        .returning()

      await syncBrandCategoryAssignments(tx, created.id, assignments)

      return created
    })

    revalidatePath("/ops/brands")
    revalidatePath("/brands")
    revalidateBrandCaches()
    revalidateCategoryCaches()

    return { success: true as const, data: brand }
  } catch (error) {
    console.error("Failed to create brand:", error)
    return { success: false as const, error: "Failed to create brand" }
  }
}

export async function updateBrand(
  id: string,
  data: Partial<z.infer<typeof brandSchema>>,
) {
  await requireResourcePermission("brand", "update")

  if (data.slug) {
    const [existing] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, data.slug))
      .limit(1)

    if (existing && existing.id !== id) {
      throw new Error("A brand with this slug already exists")
    }
  }

  const assignments = data.categoryAssignments
    ? normalizeAssignments(data.categoryAssignments)
    : undefined

  if (assignments) {
    await ensureTopLevelCategories(assignments.map((item) => item.categoryId))

    const assignedCategoryIds = assignments.map((item) => item.categoryId)
    const modelsByBrand = await db
      .select({
        id: models.id,
        primaryCategoryId: models.primaryCategoryId,
      })
      .from(models)
      .where(eq(models.brandId, id))

    const invalidModel = modelsByBrand.find(
      (model) => !assignedCategoryIds.includes(model.primaryCategoryId),
    )

    if (invalidModel) {
      throw new Error(
        "Cannot remove a category assignment that is used by existing models",
      )
    }
  }

  const brand = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(brands)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        logo: data.logo ?? null,
        websiteUrl: data.websiteUrl ?? null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, id))
      .returning()

    if (!updated) {
      throw new Error("Brand not found")
    }

    if (assignments) {
      await syncBrandCategoryAssignments(tx, id, assignments)
    }

    return updated
  })

  revalidatePath("/ops/brands")
  revalidatePath(`/ops/brands/${id}`)
  revalidatePath("/brands")
  if (brand?.slug) {
    revalidatePath(`/brands/${brand.slug}`)
  }
  revalidateBrandCaches()
  revalidateCategoryCaches()
  revalidateProductCaches()

  return brand
}

export async function deleteBrand(id: string) {
  try {
    await requireResourcePermission("brand", "delete")

    const [assignedProduct] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.brandId, id))
      .limit(1)

    if (assignedProduct) {
      return {
        success: false as const,
        error:
          "Cannot delete a brand that is assigned to products. Reassign or delete those products first.",
      }
    }

    const [assignedModel] = await db
      .select({ id: models.id })
      .from(models)
      .where(eq(models.brandId, id))
      .limit(1)

    if (assignedModel) {
      return {
        success: false as const,
        error:
          "Cannot delete a brand that still has models. Delete or reassign those models first.",
      }
    }

    await db.delete(brands).where(eq(brands.id, id))

    revalidatePath("/ops/brands")
    revalidatePath("/brands")
    revalidateBrandCaches()
    revalidateCategoryCaches()

    return { success: true as const }
  } catch (error) {
    console.error("Failed to delete brand:", error)
    return { success: false as const, error: "Failed to delete brand" }
  }
}
