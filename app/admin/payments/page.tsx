import { Suspense } from "react"

import { BankTransferQueue } from "@/components/admin/payments/bank-transfer-queue"
import { PaymentStats } from "@/components/admin/payments/payment-stats"
import { PaymentsTable } from "@/components/admin/payments/payments-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPayments,
  getPaymentStats,
  getPendingBankTransfers,
} from "@/lib/actions/payment"

function PaymentStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-muted animate-pulse rounded" />
      <div className="border rounded-lg">
        <div className="h-10 border-b bg-muted/50" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 border-b flex items-center px-4">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function PaymentStatsSection() {
  const stats = await getPaymentStats()
  return <PaymentStats stats={stats} />
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function PaymentsTableSection({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const page = Number(searchParams.page) || 1
  const status = searchParams.status
  const method = searchParams.method
  const search = searchParams.search

  const { payments, pagination } = await getPayments({
    page,
    status,
    method,
    search,
  })

  return <PaymentsTable payments={payments} pagination={pagination} />
}

async function BankTransferQueueSection() {
  const pendingTransfers = await getPendingBankTransfers()
  return <BankTransferQueue transfers={pendingTransfers} />
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = (params.tab as string) || "all"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage payment transactions and verify bank transfers
        </p>
      </div>

      <Suspense fallback={<PaymentStatsSkeleton />}>
        <PaymentStatsSection />
      </Suspense>

      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="bank-transfers">Bank Transfer Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                View and manage all payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton />}>
                <PaymentsTableSection
                  searchParams={params as Record<string, string | undefined>}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-transfers">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bank Transfers</CardTitle>
              <CardDescription>
                Verify bank transfer payments with uploaded proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton />}>
                <BankTransferQueueSection />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
