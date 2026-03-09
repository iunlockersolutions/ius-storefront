"use client"

import Link from "next/link"

import { ArrowLeft } from "lucide-react"

import { CustomerDetail } from "@/components/admin/customers/customer-detail"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { Button } from "@/components/ui/button"
import { useAdminCustomerOrdersQuery } from "@/hooks/admin/use-admin-customer-orders-query"
import { useAdminCustomerQuery } from "@/hooks/admin/use-admin-customer-query"
import { useCustomerRolesQuery } from "@/hooks/admin/use-customer-roles-query"

interface CustomerDetailPageClientProps {
  customerId: string
}

export function CustomerDetailPageClient({
  customerId,
}: CustomerDetailPageClientProps) {
  const customerQuery = useAdminCustomerQuery(customerId)
  const customerOrdersQuery = useAdminCustomerOrdersQuery({
    customerId,
    page: 1,
    limit: 10,
  })
  const rolesQuery = useCustomerRolesQuery()

  if (
    customerQuery.isLoading ||
    customerOrdersQuery.isLoading ||
    rolesQuery.isLoading
  ) {
    return <AdminQueryLoadingState />
  }

  if (customerQuery.error || customerOrdersQuery.error || rolesQuery.error) {
    const message = getQueryErrorMessage(
      customerQuery.error ?? customerOrdersQuery.error ?? rolesQuery.error,
      "Failed to load customer details",
    )

    return (
      <AdminQueryErrorState
        message={message}
        onRetry={() =>
          Promise.all([
            customerQuery.refetch(),
            customerOrdersQuery.refetch(),
            rolesQuery.refetch(),
          ])
        }
        backHref="/ops/customers"
        backLabel="Back to Customers"
      />
    )
  }

  if (!customerQuery.data) {
    return (
      <AdminQueryEmptyState
        message="Customer not found."
        backHref="/ops/customers"
        backLabel="Back to Customers"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ops/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {customerQuery.data.user.name || customerQuery.data.user.email}
          </h1>
          <p className="text-muted-foreground">Customer Details</p>
        </div>
      </div>

      <CustomerDetail
        customer={customerQuery.data}
        orders={customerOrdersQuery.data?.orders ?? []}
        ordersPagination={
          customerOrdersQuery.data?.pagination ?? {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          }
        }
        allRoles={rolesQuery.data ?? []}
      />
    </div>
  )
}
