"use server"

import { revalidatePath } from "next/cache"

import { asc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { brands, categories, categoryBrandMenuConfigs } from "@/lib/db/schema"
import {
  revalidateBrandCaches,
  revalidateCategoryCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

const categoryBrandMenuConfigSchema = z.object({
  showInProductMenu: z.boolean(),
  menuPriority: z.number().int().default(0),
})

export async function getCategoryBrandMenuConfigs() {
  await requireResourcePermission("category", "list")

  const categoryPriorityGroup = sql<number>`case when ${categories.productMenuPriority} > 0 then 0 else 1 end`
  const brandPriorityGroup = sql<number>`case when ${categoryBrandMenuConfigs.menuPriority} > 0 then 0 else 1 end`

  return db
    .select({
      id: categoryBrandMenuConfigs.id,
      categoryId: categoryBrandMenuConfigs.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryPriority: categories.productMenuPriority,
      brandId: categoryBrandMenuConfigs.brandId,
      brandName: brands.name,
      brandSlug: brands.slug,
      showInProductMenu: categoryBrandMenuConfigs.showInProductMenu,
      menuPriority: categoryBrandMenuConfigs.menuPriority,
      modelGroupCount: sql<number>`(
        select count(*)
        from "product_model_groups"
        where "product_model_groups"."category_id" = "category_brand_menu_configs"."category_id"
          and "product_model_groups"."brand_id" = "category_brand_menu_configs"."brand_id"
      )`,
      productCount: sql<number>`(
        select count(*)
        from "products"
        inner join "product_model_groups"
          on "product_model_groups"."id" = "products"."product_model_group_id"
        where "product_model_groups"."category_id" = "category_brand_menu_configs"."category_id"
          and "product_model_groups"."brand_id" = "category_brand_menu_configs"."brand_id"
      )`,
    })
    .from(categoryBrandMenuConfigs)
    .innerJoin(
      categories,
      eq(categoryBrandMenuConfigs.categoryId, categories.id),
    )
    .innerJoin(brands, eq(categoryBrandMenuConfigs.brandId, brands.id))
    .orderBy(
      asc(categoryPriorityGroup),
      asc(categories.productMenuPriority),
      asc(categories.sortOrder),
      asc(brandPriorityGroup),
      asc(categoryBrandMenuConfigs.menuPriority),
      asc(brands.sortOrder),
      asc(brands.name),
    )
}

export async function updateCategoryBrandMenuConfig(
  id: string,
  data: z.infer<typeof categoryBrandMenuConfigSchema>,
) {
  await requireResourcePermission("category", "update")
  const validated = categoryBrandMenuConfigSchema.parse(data)

  const [config] = await db
    .update(categoryBrandMenuConfigs)
    .set({
      showInProductMenu: validated.showInProductMenu,
      menuPriority: validated.menuPriority,
      updatedAt: new Date(),
    })
    .where(eq(categoryBrandMenuConfigs.id, id))
    .returning()

  if (!config) {
    throw new Error("Category brand menu config not found")
  }

  revalidatePath("/ops/product-menu-configs")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()

  return config
}
