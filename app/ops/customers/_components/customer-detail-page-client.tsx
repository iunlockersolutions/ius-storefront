"use client"

import Link from "next/link"

import { ArrowLeft } from "lucide-react"

import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { Button } from "@/components/ui/button"
import { useAdminCustomerOrdersQuery } from "@/services/queries/use-admin-customer-orders-query"
import { useAdminCustomerQuery } from "@/services/queries/use-admin-customer-query"

import { CustomerDetail } from "./customer-detail"

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

  if (customerQuery.isLoading || customerOrdersQuery.isLoading) {
    return <AdminQueryLoadingState />
  }

  if (customerQuery.error || customerOrdersQuery.error) {
    const message = getQueryErrorMessage(
      customerQuery.error ?? customerOrdersQuery.error,
      "Failed to load customer details",
    )

    return (
      <AdminQueryErrorState
        message={message}
        onRetry={() =>
          Promise.all([customerQuery.refetch(), customerOrdersQuery.refetch()])
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
      />
    </div>
  )
}
