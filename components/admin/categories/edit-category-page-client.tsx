"use client"

import Link from "next/link"

import { EditCategoryForm } from "@/components/admin/categories/edit-category-form"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { Button } from "@/components/ui/button"
import { useAdminCategoriesQuery } from "@/hooks/admin/use-admin-categories-query"
import { useAdminCategoryQuery } from "@/hooks/admin/use-admin-category-query"

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
        backHref="/admin/categories"
        backLabel="Back to Categories"
      />
    )
  }

  if (!categoryQuery.data) {
    return (
      <AdminQueryEmptyState
        message="Category not found."
        backHref="/admin/categories"
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
      level: 0,
      path: cat.name,
    }))

  return (
    <EditCategoryForm
      category={categoryQuery.data}
      parentOptions={parentOptions}
    />
  )
}
