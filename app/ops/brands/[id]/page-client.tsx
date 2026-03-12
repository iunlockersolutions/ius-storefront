"use client"

import { BrandDetail } from "@/components/admin/brands/brand-detail"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useAdminBrandQuery } from "@/hooks/admin/use-admin-brand-query"
import { useAdminCategoriesQuery } from "@/hooks/admin/use-admin-categories-query"

interface EditBrandPageClientProps {
  brandId: string
}

export function EditBrandPageClient({ brandId }: EditBrandPageClientProps) {
  const brandQuery = useAdminBrandQuery(brandId)
  const categoriesQuery = useAdminCategoriesQuery()

  if (
    brandQuery.isLoading ||
    brandQuery.isFetching ||
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

  if (brandQuery.error || categoriesQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          brandQuery.error ?? categoriesQuery.error,
          "Failed to load brand",
        )}
        onRetry={() => Promise.all([brandQuery.refetch(), categoriesQuery.refetch()])}
        backHref="/ops/catalog-setup?tab=brands"
        backLabel="Back to Brands"
      />
    )
  }

  if (!brandQuery.data) {
    return (
      <AdminQueryEmptyState
        message="Brand not found."
        backHref="/ops/catalog-setup?tab=brands"
        backLabel="Back to Brands"
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

  return (
    <BrandDetail
      brand={brandQuery.data}
      categories={topLevelCategories}
      onRefresh={() =>
        Promise.all([brandQuery.refetch(), categoriesQuery.refetch()])
      }
    />
  )
}
