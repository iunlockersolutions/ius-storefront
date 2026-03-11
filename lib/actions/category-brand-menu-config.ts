"use server"

import { revalidatePath } from "next/cache"

import { asc, eq, sql } from "drizzle-orm"
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

const brandCategoryAssignmentSchema = z.object({
  showInProductMenu: z.boolean(),
  menuPriority: z.number().int().default(0),
})

export async function getCategoryBrandMenuConfigs() {
  await requireResourcePermission("category", "list")

  const categoryPriorityGroup = sql<number>`case when ${categories.productMenuPriority} > 0 then 0 else 1 end`
  const brandPriorityGroup = sql<number>`case when ${brandCategoryAssignments.navPriority} > 0 then 0 else 1 end`

  return db
    .select({
      id: brandCategoryAssignments.id,
      categoryId: brandCategoryAssignments.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryPriority: categories.productMenuPriority,
      brandId: brandCategoryAssignments.brandId,
      brandName: brands.name,
      brandSlug: brands.slug,
      showInProductMenu: brandCategoryAssignments.showInProductMenu,
      menuPriority: brandCategoryAssignments.navPriority,
      modelGroupCount: sql<number>`(
        select count(*)::int
        from "models"
        where "models"."primary_category_id" = "brand_category_assignments"."category_id"
          and "models"."brand_id" = "brand_category_assignments"."brand_id"
      )`,
      productCount: sql<number>`(
        select count(*)::int
        from "products"
        inner join "models" on "models"."id" = "products"."model_id"
        where "models"."primary_category_id" = "brand_category_assignments"."category_id"
          and "models"."brand_id" = "brand_category_assignments"."brand_id"
      )`,
    })
    .from(brandCategoryAssignments)
    .innerJoin(
      categories,
      eq(brandCategoryAssignments.categoryId, categories.id),
    )
    .innerJoin(brands, eq(brandCategoryAssignments.brandId, brands.id))
    .orderBy(
      asc(categoryPriorityGroup),
      asc(categories.productMenuPriority),
      asc(categories.sortOrder),
      asc(brandPriorityGroup),
      asc(brandCategoryAssignments.navPriority),
      asc(brands.sortOrder),
      asc(brands.name),
    )
}

export async function updateCategoryBrandMenuConfig(
  id: string,
  data: z.infer<typeof brandCategoryAssignmentSchema>,
) {
  await requireResourcePermission("category", "update")
  const validated = brandCategoryAssignmentSchema.parse(data)

  const [config] = await db
    .update(brandCategoryAssignments)
    .set({
      showInProductMenu: validated.showInProductMenu,
      navPriority: validated.menuPriority,
      updatedAt: new Date(),
    })
    .where(eq(brandCategoryAssignments.id, id))
    .returning()

  if (!config) {
    throw new Error("Brand category assignment not found")
  }

  revalidatePath("/ops/product-menu-configs")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return config
}
