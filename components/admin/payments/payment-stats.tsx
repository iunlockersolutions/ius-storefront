"use client"

import { CheckCircle, Clock, CreditCard, XCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentStatsProps {
  stats: {
    pendingBankTransfers: number
    totalCompleted: number
    totalFailed: number
    totalPending: number
  }
}

export function PaymentStats({ stats }: PaymentStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Verification
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingBankTransfers}</div>
          <p className="text-xs text-muted-foreground">
            Bank transfers awaiting review
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">All Pending</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPending}</div>
          <p className="text-xs text-muted-foreground">
            Total pending payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCompleted}</div>
          <p className="text-xs text-muted-foreground">
            Successfully processed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFailed}</div>
          <p className="text-xs text-muted-foreground">Declined or rejected</p>
        </CardContent>
      </Card>
    </div>
  )
}
