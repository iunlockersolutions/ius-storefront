"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, ExternalLink, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Payment {
  id: string
  orderId: string
  method: string
  status: string
  amount: string
  currency: string
  externalId: string | null
  processedAt: Date | null
  createdAt: Date
  orderNumber: string
  customerEmail: string
  customerName: string | null
}

interface PaymentsTableProps {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  failed: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  refunded: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
}

const methodLabels: Record<string, string> = {
  card: "Card",
  bank_transfer: "Bank Transfer",
  cash_on_delivery: "COD",
}

export function PaymentsTable({ payments, pagination }: PaymentsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    params.delete("page") // Reset to page 1 on filter change
    router.push(`/admin/payments?${params.toString()}`)
  }

  const handleSearch = () => {
    updateFilters({ search })
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/admin/payments?${params.toString()}`)
  }

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
    }).format(parseFloat(amount))
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Search by order number or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={(value) => updateFilters({ status: value })}
          >
            <SelectTrigger className="w-32.5">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("method") || "all"}
            onValueChange={(value) => updateFilters({ method: value })}
          >
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${payment.orderId}`}
                      className="font-medium hover:underline"
                    >
                      {payment.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {payment.customerName || "Guest"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {methodLabels[payment.method] || payment.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[payment.status] || ""}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(payment.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/orders/${payment.orderId}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} payments
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
