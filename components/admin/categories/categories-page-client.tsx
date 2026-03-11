"use client"

import { CategoriesTable } from "@/components/admin/categories/categories-table"
import { useAdminCategoriesQuery } from "@/hooks/admin/use-admin-categories-query"

export function CategoriesPageClient() {
  const categoriesQuery = useAdminCategoriesQuery()

  const categories = (categoriesQuery.data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    level: category.level || 0,
    path: category.path || category.name,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    productCount: category.productCount,
    optionTemplates: category.optionTemplates,
  }))

  return (
    <CategoriesTable
      categories={categories}
      isLoading={categoriesQuery.isLoading || categoriesQuery.isFetching}
      errorMessage={
        categoriesQuery.error instanceof Error
          ? categoriesQuery.error.message
          : null
      }
      onRefetch={categoriesQuery.refetch}
    />
  )
}
