"use client"

import { EditBrandForm } from "@/components/admin/brands/edit-brand-form"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useAdminBrandQuery } from "@/hooks/admin/use-admin-brand-query"

interface EditBrandPageClientProps {
  brandId: string
}

export function EditBrandPageClient({
  brandId,
}: EditBrandPageClientProps) {
  const brandQuery = useAdminBrandQuery(brandId)

  if (brandQuery.isLoading || brandQuery.isFetching) {
    return (
      <AdminQueryLoadingState
        wrapperClassName="max-w-2xl space-y-4"
        skeletonClassName="h-64 w-full"
      />
    )
  }

  if (brandQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(brandQuery.error, "Failed to load brand")}
        onRetry={brandQuery.refetch}
        backHref="/ops/brands"
        backLabel="Back to Brands"
      />
    )
  }

  if (!brandQuery.data) {
    return (
      <AdminQueryEmptyState
        message="Brand not found."
        backHref="/ops/brands"
        backLabel="Back to Brands"
      />
    )
  }

  return <EditBrandForm brand={brandQuery.data} />
}
