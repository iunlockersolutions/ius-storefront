import { unstable_cache } from "next/cache"

import { and, asc, eq, isNull, sql } from "drizzle-orm"

import { getActiveBrands } from "@/lib/actions/brand"
import { withStorefrontCatalogFallback } from "@/lib/actions/storefront-catalog-read"
import { db } from "@/lib/db"
import {
  brandCategoryAssignments,
  brands,
  categories,
  models,
} from "@/lib/db/schema"

export type StorefrontNavModelLink = {
  id: string
  name: string
  href: string
}

export type StorefrontNavBrand = {
  id: string
  name: string
  slug: string
  href: string
  models: StorefrontNavModelLink[]
}

export type StorefrontNavCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  productCount: number
  brands: StorefrontNavBrand[]
}

export type StorefrontNavigationData = {
  productCategories: StorefrontNavCategory[]
  brands: Array<{
    id: string
    name: string
    slug: string
    productCount: number
  }>
}

/*
@depricated 
*/
export const getStorefrontNavigationData = unstable_cache(
  async (): Promise<StorefrontNavigationData> => {
    const categoryPriorityGroup = sql<number>`case when ${categories.productMenuPriority} > 0 then 0 else 1 end`
    const brandPriorityGroup = sql<number>`case when ${brandCategoryAssignments.navPriority} > 0 then 0 else 1 end`
    const modelPriorityGroup = sql<number>`case when ${models.navPriority} > 0 then 0 else 1 end`

    const [menuRows, activeBrands] = await Promise.all([
      withStorefrontCatalogFallback(
        "storefront:product-menu",
        [] as Array<{
          categoryId: string
          categoryName: string
          categorySlug: string
          categoryDescription: string | null
          categoryImage: string | null
          brandId: string
          brandName: string
          brandSlug: string
          modelId: string
          modelName: string
          modelSlug: string
          activeProductCount: number
        }>,
        () =>
          db
            .select({
              categoryId: categories.id,
              categoryName: categories.name,
              categorySlug: categories.slug,
              categoryDescription: categories.description,
              categoryImage: categories.image,
              brandId: brands.id,
              brandName: brands.name,
              brandSlug: brands.slug,
              modelId: models.id,
              modelName: models.name,
              modelSlug: models.slug,
              activeProductCount: sql<number>`(
                select count(*)::int
                from "products"
                where "products"."model_id" = "models"."id"
                  and "products"."status" = 'active'
              )`,
            })
            .from(models)
            .innerJoin(categories, eq(models.primaryCategoryId, categories.id))
            .innerJoin(brands, eq(models.brandId, brands.id))
            .innerJoin(
              brandCategoryAssignments,
              and(
                eq(brandCategoryAssignments.brandId, brands.id),
                eq(brandCategoryAssignments.categoryId, categories.id),
              ),
            )
            .where(
              and(
                eq(categories.isActive, true),
                eq(categories.showInProductMenu, true),
                isNull(categories.parentId),
                eq(brands.isActive, true),
                eq(brandCategoryAssignments.showInProductMenu, true),
                eq(models.isActive, true),
                eq(models.showInProductMenu, true),
                sql`exists (
                  select 1
                  from "products"
                  where "products"."model_id" = "models"."id"
                    and "products"."status" = 'active'
                )`,
              ),
            )
            .orderBy(
              asc(categoryPriorityGroup),
              asc(categories.productMenuPriority),
              asc(categories.sortOrder),
              asc(categories.name),
              asc(brandPriorityGroup),
              asc(brandCategoryAssignments.navPriority),
              asc(brands.sortOrder),
              asc(brands.name),
              asc(modelPriorityGroup),
              asc(models.navPriority),
              asc(models.name),
            ),
      ),
      getActiveBrands({ failSoft: true }),
    ])

    const categoryMap = new Map<string, StorefrontNavCategory>()

    for (const row of menuRows) {
      if (!categoryMap.has(row.categoryId)) {
        categoryMap.set(row.categoryId, {
          id: row.categoryId,
          name: row.categoryName,
          slug: row.categorySlug,
          description: row.categoryDescription,
          image: row.categoryImage,
          productCount: 0,
          brands: [],
        })
      }

      const category = categoryMap.get(row.categoryId)!
      category.productCount += Number(row.activeProductCount)

      let brand = category.brands.find((item) => item.id === row.brandId)
      if (!brand) {
        brand = {
          id: row.brandId,
          name: row.brandName,
          slug: row.brandSlug,
          href: `/products?category=${row.categorySlug}&brand=${row.brandSlug}`,
          models: [],
        }
        category.brands.push(brand)
      }

      brand.models.push({
        id: row.modelId,
        name: row.modelName,
        href: `/products/models/${row.modelSlug}`,
      })
    }

    return {
      productCategories: Array.from(categoryMap.values()),
      brands: activeBrands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount: Number(brand.productCount),
      })),
    }
  },
  ["storefront-product-menu"],
  {
    revalidate: 3600,
    tags: [
      "product-menu",
      "categories",
      "brands",
      "products",
      "models",
      "brand-category-assignments",
    ],
  },
)
