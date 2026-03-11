"use server"

import { revalidatePath } from "next/cache"

import { and, asc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  brands,
  categories,
  categoryBrandMenuConfigs,
  productModelGroups,
  products,
} from "@/lib/db/schema"
import { slugify } from "@/lib/utils"
import {
  revalidateBrandCaches,
  revalidateCategoryCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

const productModelGroupSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  showInProductMenu: z.boolean().default(true),
  menuPriority: z.number().int().default(0),
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
    throw new Error("Product model groups must use a top-level category")
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

async function ensureCategoryBrandMenuConfig(
  categoryId: string,
  brandId: string,
) {
  await db
    .insert(categoryBrandMenuConfigs)
    .values({
      categoryId,
      brandId,
    })
    .onConflictDoNothing()
}

export async function getProductModelGroups(options?: {
  categoryId?: string
  brandId?: string
  includeInactive?: boolean
}) {
  const modelPriorityGroup = sql<number>`case when ${productModelGroups.menuPriority} > 0 then 0 else 1 end`
  const conditions = []

  if (options?.categoryId) {
    conditions.push(eq(productModelGroups.categoryId, options.categoryId))
  }

  if (options?.brandId) {
    conditions.push(eq(productModelGroups.brandId, options.brandId))
  }

  if (!options?.includeInactive) {
    conditions.push(eq(productModelGroups.isActive, true))
  }

  const whereClause = conditions.length ? and(...conditions) : undefined

  return db
    .select({
      id: productModelGroups.id,
      name: productModelGroups.name,
      slug: productModelGroups.slug,
      description: productModelGroups.description,
      categoryId: productModelGroups.categoryId,
      categoryName: categories.name,
      brandId: productModelGroups.brandId,
      brandName: brands.name,
      showInProductMenu: productModelGroups.showInProductMenu,
      menuPriority: productModelGroups.menuPriority,
      isActive: productModelGroups.isActive,
      productCount: sql<number>`(
        select count(*)
        from "products"
        where "products"."product_model_group_id" = "product_model_groups"."id"
      )`,
    })
    .from(productModelGroups)
    .innerJoin(categories, eq(productModelGroups.categoryId, categories.id))
    .innerJoin(brands, eq(productModelGroups.brandId, brands.id))
    .where(whereClause)
    .orderBy(
      asc(modelPriorityGroup),
      asc(productModelGroups.menuPriority),
      asc(categories.sortOrder),
      asc(brands.sortOrder),
      asc(productModelGroups.name),
    )
}

export async function getProductModelGroup(id: string) {
  const [group] = await db
    .select({
      id: productModelGroups.id,
      name: productModelGroups.name,
      slug: productModelGroups.slug,
      description: productModelGroups.description,
      categoryId: productModelGroups.categoryId,
      categoryName: categories.name,
      brandId: productModelGroups.brandId,
      brandName: brands.name,
      showInProductMenu: productModelGroups.showInProductMenu,
      menuPriority: productModelGroups.menuPriority,
      isActive: productModelGroups.isActive,
    })
    .from(productModelGroups)
    .innerJoin(categories, eq(productModelGroups.categoryId, categories.id))
    .innerJoin(brands, eq(productModelGroups.brandId, brands.id))
    .where(eq(productModelGroups.id, id))
    .limit(1)

  return group || null
}

export async function getProductModelGroupBySlug(slug: string) {
  return withStorefrontCatalogFallback(
    "product-model-groups:getBySlug",
    null,
    async () => {
      const [group] = await db
        .select({
          id: productModelGroups.id,
          name: productModelGroups.name,
          slug: productModelGroups.slug,
          description: productModelGroups.description,
          categoryId: productModelGroups.categoryId,
          categoryName: categories.name,
          categorySlug: categories.slug,
          brandId: productModelGroups.brandId,
          brandName: brands.name,
          brandSlug: brands.slug,
          showInProductMenu: productModelGroups.showInProductMenu,
          menuPriority: productModelGroups.menuPriority,
          isActive: productModelGroups.isActive,
        })
        .from(productModelGroups)
        .innerJoin(categories, eq(productModelGroups.categoryId, categories.id))
        .innerJoin(brands, eq(productModelGroups.brandId, brands.id))
        .where(
          and(
            eq(productModelGroups.slug, slug),
            eq(productModelGroups.isActive, true),
          ),
        )
        .limit(1)

      return group || null
    },
  )
}

export async function getRelatedProductModelGroups(groupId: string) {
  const [group] = await db
    .select({
      id: productModelGroups.id,
      categoryId: productModelGroups.categoryId,
      brandId: productModelGroups.brandId,
    })
    .from(productModelGroups)
    .where(eq(productModelGroups.id, groupId))
    .limit(1)

  if (!group) {
    return []
  }

  return db
    .select({
      id: productModelGroups.id,
      name: productModelGroups.name,
      slug: productModelGroups.slug,
    })
    .from(productModelGroups)
    .where(
      and(
        eq(productModelGroups.categoryId, group.categoryId),
        eq(productModelGroups.brandId, group.brandId),
        eq(productModelGroups.isActive, true),
      ),
    )
    .orderBy(
      asc(
        sql<number>`case when ${productModelGroups.menuPriority} > 0 then 0 else 1 end`,
      ),
      asc(productModelGroups.menuPriority),
      asc(productModelGroups.name),
    )
}

export async function createProductModelGroup(
  data: z.infer<typeof productModelGroupSchema>,
) {
  await requireResourcePermission("product", "create")
  const validated = productModelGroupSchema.parse(data)
  const category = await ensureTopLevelCategory(validated.categoryId)
  const brand = await ensureBrand(validated.brandId)
  const slug =
    validated.slug ||
    `${category.slug}-${brand.slug}-${slugify(validated.name)}`

  const [existing] = await db
    .select({ id: productModelGroups.id })
    .from(productModelGroups)
    .where(eq(productModelGroups.slug, slug))
    .limit(1)

  if (existing) {
    throw new Error("A product model group with this slug already exists")
  }

  const [group] = await db
    .insert(productModelGroups)
    .values({
      name: validated.name,
      slug,
      description: validated.description || null,
      categoryId: validated.categoryId,
      brandId: validated.brandId,
      showInProductMenu: validated.showInProductMenu,
      menuPriority: validated.menuPriority,
      isActive: validated.isActive,
    })
    .returning()

  await ensureCategoryBrandMenuConfig(validated.categoryId, validated.brandId)

  revalidatePath("/ops/product-model-groups")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return group
}

export async function updateProductModelGroup(
  id: string,
  data: Partial<z.infer<typeof productModelGroupSchema>>,
) {
  await requireResourcePermission("product", "update")

  const [existingGroup] = await db
    .select({
      id: productModelGroups.id,
      slug: productModelGroups.slug,
      categoryId: productModelGroups.categoryId,
      brandId: productModelGroups.brandId,
    })
    .from(productModelGroups)
    .where(eq(productModelGroups.id, id))
    .limit(1)

  if (!existingGroup) {
    throw new Error("Product model group not found")
  }

  const nextCategoryId = data.categoryId || existingGroup.categoryId
  const nextBrandId = data.brandId || existingGroup.brandId

  const category = await ensureTopLevelCategory(nextCategoryId)
  const brand = await ensureBrand(nextBrandId)
  const nextName = data.name
  const nextSlug =
    data.slug ||
    (nextName
      ? `${category.slug}-${brand.slug}-${slugify(nextName)}`
      : existingGroup.slug)

  if (nextSlug !== existingGroup.slug) {
    const [slugConflict] = await db
      .select({ id: productModelGroups.id })
      .from(productModelGroups)
      .where(eq(productModelGroups.slug, nextSlug))
      .limit(1)

    if (slugConflict && slugConflict.id !== id) {
      throw new Error("A product model group with this slug already exists")
    }
  }

  const [group] = await db
    .update(productModelGroups)
    .set({
      ...data,
      slug: nextSlug,
      description:
        data.description === undefined ? undefined : data.description || null,
      updatedAt: new Date(),
    })
    .where(eq(productModelGroups.id, id))
    .returning()

  await ensureCategoryBrandMenuConfig(nextCategoryId, nextBrandId)

  revalidatePath("/ops/product-model-groups")
  revalidatePath(`/ops/product-model-groups/${id}`)
  revalidatePath(`/products/models/${group.slug}`)
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return group
}

export async function deleteProductModelGroup(id: string) {
  await requireResourcePermission("product", "delete")

  const [linkedProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.productModelGroupId, id))
    .limit(1)

  if (linkedProduct) {
    throw new Error(
      "Cannot delete a product model group that still has assigned products",
    )
  }

  await db.delete(productModelGroups).where(eq(productModelGroups.id, id))

  revalidatePath("/ops/product-model-groups")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()
}
