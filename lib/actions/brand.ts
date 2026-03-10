"use server"

import { revalidatePath } from "next/cache"

import { asc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { brands, products } from "@/lib/db/schema"
import {
  revalidateBrandCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

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
})

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function getBrands() {
  return db
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
        select count(*)
        from "products"
        where "products"."brand_id" = "brands"."id"
      )`,
    })
    .from(brands)
    .orderBy(asc(brands.sortOrder), asc(brands.name))
}

export async function getActiveBrands(options?: { failSoft?: boolean }) {
  const read = () =>
    db
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
          select count(*)
          from "products"
          where "products"."brand_id" = "brands"."id"
            and "products"."status" = 'active'
        )`,
      })
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(asc(brands.sortOrder), asc(brands.name))

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
        select count(*)
        from "products"
        where "products"."brand_id" = "brands"."id"
      )`,
    })
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1)

  return brand || null
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
          select count(*)
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

    const [brand] = await db
      .insert(brands)
      .values({
        ...validated,
        slug,
      })
      .returning()

    revalidatePath("/ops/brands")
    revalidatePath("/brands")
    revalidateBrandCaches()

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

  const [brand] = await db
    .update(brands)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, id))
    .returning()

  revalidatePath("/ops/brands")
  revalidatePath(`/ops/brands/${id}`)
  revalidatePath("/brands")
  if (brand?.slug) {
    revalidatePath(`/brands/${brand.slug}`)
  }
  revalidateBrandCaches()
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

    await db.delete(brands).where(eq(brands.id, id))

    revalidatePath("/ops/brands")
    revalidatePath("/brands")
    revalidateBrandCaches()

    return { success: true as const }
  } catch (error) {
    console.error("Failed to delete brand:", error)
    return { success: false as const, error: "Failed to delete brand" }
  }
}
