"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminPaymentsQuery } from "@/services/queries/use-admin-payments-query"
import { usePaymentStatsQuery } from "@/services/queries/use-payment-stats-query"
import { usePendingBankTransfersQuery } from "@/services/queries/use-pending-bank-transfers-query"

import { BankTransferQueue } from "./bank-transfer-queue"
import { PaymentStats } from "./payment-stats"
import { PaymentsTable } from "./payments-table"

interface PaymentsPageClientProps {
  tab: string
  page: number
  status?: string
  method?: string
  search?: string
}

export function PaymentsPageClient({
  tab,
  page,
  status,
  method,
  search,
}: PaymentsPageClientProps) {
  const statsQuery = usePaymentStatsQuery()
  const paymentsQuery = useAdminPaymentsQuery({
    page,
    status,
    method,
    search,
  })
  const bankTransfersQuery = usePendingBankTransfersQuery()

  return (
    <>
      <PaymentStats
        stats={
          statsQuery.data ?? {
            pendingBankTransfers: 0,
            totalCompleted: 0,
            totalFailed: 0,
            totalPending: 0,
          }
        }
      />

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
              <PaymentsTable
                payments={paymentsQuery.data?.payments ?? []}
                pagination={
                  paymentsQuery.data?.pagination ?? {
                    page,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                  }
                }
                isLoading={paymentsQuery.isLoading || paymentsQuery.isFetching}
                errorMessage={
                  paymentsQuery.error instanceof Error
                    ? paymentsQuery.error.message
                    : null
                }
                onRefetch={paymentsQuery.refetch}
              />
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
              <BankTransferQueue
                transfers={bankTransfersQuery.data ?? []}
                isLoading={
                  bankTransfersQuery.isLoading || bankTransfersQuery.isFetching
                }
                errorMessage={
                  bankTransfersQuery.error instanceof Error
                    ? bankTransfersQuery.error.message
                    : null
                }
                onRefetch={bankTransfersQuery.refetch}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
