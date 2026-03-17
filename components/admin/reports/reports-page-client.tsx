"use client"

import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { CustomerStats } from "@/components/admin/reports/customer-stats"
import { OrderStatusChart } from "@/components/admin/reports/order-status-chart"
import { PaymentMethodsChart } from "@/components/admin/reports/payment-methods-chart"
import { SalesChart } from "@/components/admin/reports/sales-chart"
import { SalesOverview } from "@/components/admin/reports/sales-overview"
import { TopProductsTable } from "@/components/admin/reports/top-products-table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminReportsQuery } from "@/services/queries/use-admin-reports-query"

interface ReportsPageClientProps {
  tab: string
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  )
}

export function ReportsPageClient({ tab }: ReportsPageClientProps) {
  const reportsQuery = useAdminReportsQuery({ days: 30, topProductsLimit: 10 })

  if (reportsQuery.isLoading || reportsQuery.isFetching) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <div className="grid gap-4 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (reportsQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          reportsQuery.error,
          "Failed to load reports",
        )}
        onRetry={reportsQuery.refetch}
      />
    )
  }

  const data = reportsQuery.data
  if (!data) {
    return <AdminQueryEmptyState message="No report data available." />
  }

  return (
    <>
      <SalesOverview stats={data.salesOverview} />

      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SalesChart data={data.salesByDay} />
            <PaymentMethodsChart data={data.paymentMethodStats} />
          </div>
        </TabsContent>

        <TabsContent value="products">
          <TopProductsTable products={data.topProducts} />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerStats stats={data.customerStats} />
        </TabsContent>

        <TabsContent value="orders">
          <OrderStatusChart data={data.orderStatusDistribution} />
        </TabsContent>
      </Tabs>
    </>
  )
}
