"use client"

import { BrandsTable } from "@/app/ops/brands/_components/brands-table"
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
