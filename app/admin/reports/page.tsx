import { Suspense } from "react"

import { CustomerStats } from "@/components/admin/reports/customer-stats"
import { OrderStatusChart } from "@/components/admin/reports/order-status-chart"
import { PaymentMethodsChart } from "@/components/admin/reports/payment-methods-chart"
import { SalesChart } from "@/components/admin/reports/sales-chart"
import { SalesOverview } from "@/components/admin/reports/sales-overview"
import { TopProductsTable } from "@/components/admin/reports/top-products-table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getCustomerStats,
  getOrderStatusDistribution,
  getPaymentMethodStats,
  getSalesByDay,
  getSalesOverview,
  getTopProducts,
} from "@/lib/actions/reports"

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

async function SalesOverviewSection() {
  const stats = await getSalesOverview()
  return <SalesOverview stats={stats} />
}

async function SalesChartSection() {
  const data = await getSalesByDay(30)
  return <SalesChart data={data} />
}

async function TopProductsSection() {
  const products = await getTopProducts(10)
  return <TopProductsTable products={products} />
}

async function PaymentMethodsSection() {
  const data = await getPaymentMethodStats()
  return <PaymentMethodsChart data={data} />
}

async function CustomerStatsSection() {
  const stats = await getCustomerStats()
  return <CustomerStats stats={stats} />
}

async function OrderStatusSection() {
  const data = await getOrderStatusDistribution()
  return <OrderStatusChart data={data} />
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Insights into your store&apos;s performance
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <SalesOverviewSection />
      </Suspense>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<ChartSkeleton />}>
              <SalesChartSection />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <PaymentMethodsSection />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Suspense fallback={<ChartSkeleton />}>
            <TopProductsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="customers">
          <Suspense fallback={<ChartSkeleton />}>
            <CustomerStatsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="orders">
          <Suspense fallback={<ChartSkeleton />}>
            <OrderStatusSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
