"use client"

import { BrandsTable } from "@/components/admin/brands/brands-table"
import { useAdminBrandsQuery } from "@/services/queries/use-admin-brands-query"

export function BrandsPageClient() {
  const brandsQuery = useAdminBrandsQuery()

  return (
    <BrandsTable
      brands={brandsQuery.data ?? []}
      isLoading={brandsQuery.isLoading || brandsQuery.isFetching}
      errorMessage={
        brandsQuery.error instanceof Error ? brandsQuery.error.message : null
      }
      onRefetch={brandsQuery.refetch}
    />
  )
}
