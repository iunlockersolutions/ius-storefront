"use server"

import { revalidatePath } from "next/cache"

import { and, asc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  categories,
  productCategoryAssignments,
  products,
} from "@/lib/db/schema"
import {
  revalidateCategoryCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  showInProductMenu: z.boolean().default(true),
  productMenuPriority: z.number().int().default(0),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
})

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type CategoryRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  showInProductMenu: boolean
  productMenuPriority: number
  metaTitle: string | null
  metaDescription: string | null
  createdAt: Date
  updatedAt: Date
  productCount: number
}

type CategoryTreeNode = CategoryRecord & {
  children: CategoryTreeNode[]
}

function buildCategoryTree(allCategories: CategoryRecord[]) {
  const categoryMap = new Map<string, CategoryTreeNode>()
  const rootCategories: CategoryTreeNode[] = []

  for (const category of allCategories) {
    categoryMap.set(category.id, { ...category, children: [] })
  }

  for (const category of allCategories) {
    const node = categoryMap.get(category.id)!

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      rootCategories.push(node)
    }
  }

  return rootCategories
}

function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  level = 0,
  pathPrefix = "",
): Array<CategoryTreeNode & { level: number; path: string }> {
  const flat: Array<CategoryTreeNode & { level: number; path: string }> = []

  for (const node of nodes) {
    const path = pathPrefix ? `${pathPrefix} / ${node.name}` : node.name
    flat.push({ ...node, level, path })
    flat.push(...flattenCategoryTree(node.children, level + 1, path))
  }

  return flat
}

async function getBaseCategories(options?: { storefrontOnly?: boolean }) {
  const activeFilter = options?.storefrontOnly
    ? and(eq(categories.isActive, true))
    : undefined

  const productCountSql = options?.storefrontOnly
    ? sql<number>`(
        select count(distinct "product_category_assignments"."product_id")
        from "product_category_assignments"
        inner join "products"
          on "products"."id" = "product_category_assignments"."product_id"
        where "product_category_assignments"."category_id" = "categories"."id"
          and "products"."status" = 'active'
      )`
    : sql<number>`(
        select count(distinct "product_category_assignments"."product_id")
        from "product_category_assignments"
        where "product_category_assignments"."category_id" = "categories"."id"
      )`

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
      productCount: productCountSql,
    })
    .from(categories)
    .where(activeFilter)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

export async function getCategories() {
  const allCategories = await getBaseCategories()
  return buildCategoryTree(allCategories)
}

export async function getCategoriesFlat() {
  const tree = await getCategories()
  return flattenCategoryTree(tree)
}

export async function getActiveCategories() {
  return withStorefrontCatalogFallback(
    "categories:getActiveCategories",
    [] as CategoryTreeNode[],
    async () => {
      const allCategories = await getBaseCategories({ storefrontOnly: true })
      return buildCategoryTree(allCategories)
    },
  )
}

export async function getActiveCategoriesFlat() {
  return withStorefrontCatalogFallback(
    "categories:getActiveCategoriesFlat",
    [] as Array<CategoryTreeNode & { level: number; path: string }>,
    async () => {
      const tree = await getActiveCategories()
      return flattenCategoryTree(tree)
    },
  )
}

export async function getCategory(id: string) {
  const [category] = await db
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
      productCount: sql<number>`(
        select count(distinct "product_category_assignments"."product_id")
        from "product_category_assignments"
        where "product_category_assignments"."category_id" = "categories"."id"
      )`,
    })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  return category || null
}

export async function getCategoryBySlug(slug: string) {
  return withStorefrontCatalogFallback(
    "categories:getCategoryBySlug",
    null,
    async () => {
      const [category] = await db
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
          productCount: sql<number>`(
            select count(distinct "product_category_assignments"."product_id")
            from "product_category_assignments"
            inner join "products"
              on "products"."id" = "product_category_assignments"."product_id"
            where "product_category_assignments"."category_id" = "categories"."id"
              and "products"."status" = 'active'
          )`,
        })
        .from(categories)
        .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
        .limit(1)

      return category || null
    },
  )
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    await requireResourcePermission("category", "create")
    const validated = categorySchema.parse(data)
    const slug = validated.slug || generateSlug(validated.name)

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)

    if (existing) {
      return {
        success: false as const,
        error: "A category with this slug already exists",
      }
    }

    const [category] = await db
      .insert(categories)
      .values({
        name: validated.name,
        slug,
        description: validated.description,
        image: validated.image,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        parentId: validated.parentId,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
        showInProductMenu: validated.showInProductMenu,
        productMenuPriority: validated.productMenuPriority,
      })
      .returning()

    revalidatePath("/ops/categories")
    revalidatePath("/categories")
    revalidateCategoryCaches()
    return { success: true as const, data: category }
  } catch (error) {
    console.error("Failed to create category:", error)
    return { success: false as const, error: "Failed to create category" }
  }
}

export async function updateCategory(
  id: string,
  data: Partial<z.infer<typeof categorySchema>>,
) {
  await requireResourcePermission("category", "update")

  if (data.slug) {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, data.slug))
      .limit(1)

    if (existing && existing.id !== id) {
      throw new Error("A category with this slug already exists")
    }
  }

  const [category] = await db
    .update(categories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning()

  revalidatePath("/ops/categories")
  revalidatePath(`/ops/categories/${id}`)
  revalidatePath("/categories")
  revalidatePath(`/categories/${category.slug}`)
  revalidateCategoryCaches()
  revalidateProductCaches()
  return category
}

export async function deleteCategory(id: string) {
  try {
    await requireResourcePermission("category", "delete")

    const [child] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, id))
      .limit(1)

    if (child) {
      return {
        success: false as const,
        error:
          "Cannot delete category with subcategories. Please move or delete subcategories first.",
      }
    }

    const [assignedProduct] = await db
      .select({ productId: productCategoryAssignments.productId })
      .from(productCategoryAssignments)
      .where(eq(productCategoryAssignments.categoryId, id))
      .limit(1)

    if (assignedProduct) {
      return {
        success: false as const,
        error:
          "Cannot delete category with assigned products. Please reassign or delete products first.",
      }
    }

    await db.delete(categories).where(eq(categories.id, id))

    revalidatePath("/ops/categories")
    revalidatePath("/categories")
    revalidateCategoryCaches()
    revalidateProductCaches()
    return { success: true as const }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { success: false as const, error: "Failed to delete category" }
  }
}
