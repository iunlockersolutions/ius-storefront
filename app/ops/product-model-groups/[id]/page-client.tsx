"use client"

import { ModelDetail } from "@/app/ops/product-model-groups/_components/model-detail"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useAdminBrandsQuery } from "@/services/queries/use-admin-brands-query"
import { useAdminCategoriesQuery } from "@/services/queries/use-admin-categories-query"
import { useAdminModelQuery } from "@/services/queries/use-admin-model-query"

interface EditProductModelGroupPageClientProps {
  modelId: string
}

export function EditProductModelGroupPageClient({
  modelId,
}: EditProductModelGroupPageClientProps) {
  const modelQuery = useAdminModelQuery(modelId)
  const brandsQuery = useAdminBrandsQuery()
  const categoriesQuery = useAdminCategoriesQuery()

  if (
    modelQuery.isLoading ||
    modelQuery.isFetching ||
    brandsQuery.isLoading ||
    brandsQuery.isFetching ||
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

  if (modelQuery.error || brandsQuery.error || categoriesQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          modelQuery.error ?? brandsQuery.error ?? categoriesQuery.error,
          "Failed to load model",
        )}
        onRetry={() =>
          Promise.all([
            modelQuery.refetch(),
            brandsQuery.refetch(),
            categoriesQuery.refetch(),
          ])
        }
        backHref="/ops/catalog-setup?tab=models"
        backLabel="Back to Models"
      />
    )
  }

  if (!modelQuery.data) {
    return (
      <AdminQueryEmptyState
        message="Model not found."
        backHref="/ops/catalog-setup?tab=models"
        backLabel="Back to Models"
      />
    )
  }

  const topLevelCategories = (categoriesQuery.data ?? [])
    .filter((category) => (category.level || 0) === 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }))

  const brandOptions = (brandsQuery.data ?? []).map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    categoryAssignments: brand.categoryAssignments.map((assignment) => ({
      categoryId: assignment.categoryId,
    })),
  }))

  return (
    <ModelDetail
      model={modelQuery.data}
      brands={brandOptions}
      categories={topLevelCategories}
      onRefresh={() =>
        Promise.all([
          modelQuery.refetch(),
          brandsQuery.refetch(),
          categoriesQuery.refetch(),
        ])
      }
    />
  )
}
