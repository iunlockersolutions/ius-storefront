"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Eye, Search } from "lucide-react"

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
import { formatCurrency, formatDate } from "@/lib/utils"

interface Order {
  id: string
  orderNumber: string
  status:
    | "draft"
    | "pending_payment"
    | "paid"
    | "processing"
    | "packing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded"
  subtotal: string
  tax: string
  shippingCost: string
  discount: string
  total: string
  createdAt: Date
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
}

interface OrdersTableProps {
  orders: Order[]
  total: number
  page: number
  totalPages: number
  search: string
  status: string
}

const statusColors: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-800",
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  packing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-orange-100 text-orange-800",
}

export function OrdersTable({
  orders,
  total,
  page,
  totalPages,
  search,
  status,
}: OrdersTableProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchInput) params.set("search", searchInput)
    if (status) params.set("status", status)
    params.set("page", "1")
    router.push(`/admin/orders?${params.toString()}`)
  }

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value && value !== "all") params.set("status", value)
    params.set("page", "1")
    router.push(`/admin/orders?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    params.set("page", newPage.toString())
    router.push(`/admin/orders?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by order number or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={status || "all"} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="packing">Packing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-17.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-neutral-500"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.orderNumber}</div>
                  </TableCell>
                  <TableCell>
                    {order.customer ? (
                      <div>
                        <div className="font-medium">
                          {order.customer.name || "—"}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {order.customer.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-400">Guest</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(parseFloat(order.total))}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Showing {orders.length} of {total} orders
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
