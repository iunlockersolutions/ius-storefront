"use server"

import { revalidatePath } from "next/cache"

import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"

import { requirePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { categories, products } from "@/lib/db/schema"

// Schema for creating/updating a category
const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Get all categories with hierarchical structure
 */
export async function getCategories() {
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name))

  // Build tree structure
  const categoryMap = new Map<
    string,
    (typeof allCategories)[0] & { children: typeof allCategories }
  >()
  const rootCategories: ((typeof allCategories)[0] & {
    children: typeof allCategories
  })[] = []

  // First pass: create map entries
  for (const category of allCategories) {
    categoryMap.set(category.id, { ...category, children: [] })
  }

  // Second pass: build tree
  for (const category of allCategories) {
    const categoryWithChildren = categoryMap.get(category.id)!
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children.push(categoryWithChildren)
      }
    } else {
      rootCategories.push(categoryWithChildren)
    }
  }

  return rootCategories
}

/**
 * Get flat list of categories (for select dropdowns)
 */
export async function getCategoriesFlat() {
  return db.select().from(categories).orderBy(asc(categories.name))
}

/**
 * Get active categories for storefront (hierarchical)
 */
export async function getActiveCategories() {
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name))

  // Build tree structure
  const categoryMap = new Map<
    string,
    (typeof allCategories)[0] & { children: typeof allCategories }
  >()
  const rootCategories: ((typeof allCategories)[0] & {
    children: typeof allCategories
  })[] = []

  // First pass: create map entries
  for (const category of allCategories) {
    categoryMap.set(category.id, { ...category, children: [] })
  }

  // Second pass: build tree
  for (const category of allCategories) {
    const categoryWithChildren = categoryMap.get(category.id)!
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children.push(categoryWithChildren)
      }
    } else {
      rootCategories.push(categoryWithChildren)
    }
  }

  return rootCategories
}

/**
 * Get a single category by ID
 */
export async function getCategory(id: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  return category || null
}

/**
 * Get a category by slug (for storefront)
 */
export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1)

  return category || null
}

/**
 * Create a new category (Admin/Manager only)
 */
export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    await requirePermission("product.write")
    const validated = categorySchema.parse(data)

    const slug = validated.slug || generateSlug(validated.name)

    // Check for duplicate slug
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)

    if (existing.length > 0) {
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
        parentId: validated.parentId,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      })
      .returning()

    revalidatePath("/admin/categories")
    revalidatePath("/categories")
    return { success: true as const, data: category }
  } catch (error) {
    console.error("Failed to create category:", error)
    return { success: false as const, error: "Failed to create category" }
  }
}

/**
 * Update a category (Admin/Manager only)
 */
export async function updateCategory(
  id: string,
  data: Partial<z.infer<typeof categorySchema>>,
) {
  await requirePermission("product.write")

  const [category] = await db
    .update(categories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning()

  revalidatePath("/admin/categories")
  revalidatePath("/categories")
  revalidatePath(`/categories/${category.slug}`)
  return category
}

/**
 * Delete a category (Admin only)
 */
export async function deleteCategory(id: string) {
  try {
    await requirePermission("product.delete")

    // Check if category has children
    const children = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, id))
      .limit(1)

    if (children.length > 0) {
      return {
        success: false as const,
        error:
          "Cannot delete category with subcategories. Please move or delete subcategories first.",
      }
    }

    // Check if category has products
    const categoryProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.categoryId, id))
      .limit(1)

    if (categoryProducts.length > 0) {
      return {
        success: false as const,
        error:
          "Cannot delete category with products. Please reassign or delete products first.",
      }
    }

    await db.delete(categories).where(eq(categories.id, id))

    revalidatePath("/admin/categories")
    revalidatePath("/categories")
    return { success: true as const }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { success: false as const, error: "Failed to delete category" }
  }
}
