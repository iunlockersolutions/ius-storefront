"use client"

import { CustomersTable } from "@/components/admin/customers/customers-table"
import { useAdminCustomersQuery } from "@/services/queries/use-admin-customers-query"

interface CustomersPageClientProps {
  page: number
  search: string
}

export function CustomersPageClient({
  page,
  search,
}: CustomersPageClientProps) {
  const customersQuery = useAdminCustomersQuery({
    page,
    limit: 20,
    search: search || undefined,
  })

  return (
    <CustomersTable
      customers={customersQuery.data?.customers ?? []}
      pagination={
        customersQuery.data?.pagination ?? {
          page,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      }
      search={search}
      isLoading={customersQuery.isLoading || customersQuery.isFetching}
      errorMessage={
        customersQuery.error instanceof Error
          ? customersQuery.error.message
          : null
      }
      onRefetch={customersQuery.refetch}
    />
  )
}
