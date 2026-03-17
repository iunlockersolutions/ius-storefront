"use client"

import { useAdminProductsQuery } from "@/services/queries/use-admin-products-query"

import { ProductsTable } from "./products-table"

interface ProductsPageClientProps {
  page: number
  search: string
  status: string
}

export function ProductsPageClient({
  page,
  search,
  status,
}: ProductsPageClientProps) {
  const productsQuery = useAdminProductsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
  })

  return (
    <ProductsTable
      products={productsQuery.data?.products ?? []}
      total={productsQuery.data?.total ?? 0}
      page={productsQuery.data?.page ?? page}
      totalPages={productsQuery.data?.totalPages ?? 0}
      search={search}
      status={status}
      isLoading={productsQuery.isLoading || productsQuery.isFetching}
      errorMessage={
        productsQuery.error instanceof Error
          ? productsQuery.error.message
          : null
      }
      onRefetch={productsQuery.refetch}
    />
  )
}
