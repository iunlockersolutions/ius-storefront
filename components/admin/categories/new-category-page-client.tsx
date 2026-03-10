"use client"

import { NewCategoryForm } from "@/components/admin/categories/new-category-form"
import {
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useAdminCategoriesQuery } from "@/hooks/admin/use-admin-categories-query"

export function NewCategoryPageClient() {
  const categoriesQuery = useAdminCategoriesQuery()

  if (categoriesQuery.isLoading || categoriesQuery.isFetching) {
    return (
      <AdminQueryLoadingState
        wrapperClassName="max-w-2xl space-y-4"
        skeletonClassName="h-64 w-full"
      />
    )
  }

  if (categoriesQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          categoriesQuery.error,
          "Failed to load categories",
        )}
        onRetry={categoriesQuery.refetch}
      />
    )
  }

  const categories = (categoriesQuery.data ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    level: cat.level || 0,
    path: cat.path || cat.name,
  }))

  return <NewCategoryForm categories={categories} />
}
