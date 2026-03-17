"use client"

import { CategoryDetail } from "@/components/admin/categories/category-detail"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useAdminCategoriesQuery } from "@/services/queries/use-admin-categories-query"
import { useAdminCategoryQuery } from "@/services/queries/use-admin-category-query"

interface EditCategoryPageClientProps {
  categoryId: string
}

export function EditCategoryPageClient({
  categoryId,
}: EditCategoryPageClientProps) {
  const categoryQuery = useAdminCategoryQuery(categoryId)
  const categoriesQuery = useAdminCategoriesQuery()

  if (
    categoryQuery.isLoading ||
    categoryQuery.isFetching ||
    categoriesQuery.isLoading ||
    categoriesQuery.isFetching
  ) {
    return (
      <AdminQueryLoadingState
        wrapperClassName="max-w-2xl space-y-4"
        skeletonClassName="h-64 w-full"
      />
    )
  }

  if (categoryQuery.error || categoriesQuery.error) {
    const message = getQueryErrorMessage(
      categoryQuery.error ?? categoriesQuery.error,
      "Failed to load category",
    )

    return (
      <AdminQueryErrorState
        message={message}
        onRetry={() =>
          Promise.all([categoryQuery.refetch(), categoriesQuery.refetch()])
        }
        backHref="/ops/categories"
        backLabel="Back to Categories"
      />
    )
  }

  if (!categoryQuery.data) {
    return (
      <AdminQueryEmptyState
        message="Category not found."
        backHref="/ops/categories"
        backLabel="Back to Categories"
      />
    )
  }

  const parentOptions = (categoriesQuery.data ?? [])
    .filter((cat) => cat.id !== categoryId)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      level: cat.level || 0,
      path: cat.path || cat.name,
    }))
  const currentCategoryListItem = (categoriesQuery.data ?? []).find(
    (cat) => cat.id === categoryId,
  )
  const parentName =
    (categoriesQuery.data ?? []).find(
      (cat) => cat.id === categoryQuery.data.parentId,
    )?.name ?? null

  return (
    <CategoryDetail
      category={categoryQuery.data}
      path={currentCategoryListItem?.path || categoryQuery.data.name}
      parentName={parentName}
      parentOptions={parentOptions}
      onRefresh={() =>
        Promise.all([categoryQuery.refetch(), categoriesQuery.refetch()])
      }
    />
  )
}
