"use client"

import Link from "next/link"

import { ShoppingBag, UserPlus, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CustomerStatsProps {
  stats: {
    totalCustomers: number
    newCustomersThisMonth: number
    customersWithOrders: number
    topCustomers: {
      userId: string | null
      email: string
      name: string | null
      orderCount: number
      totalSpent: number
    }[]
  }
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const conversionRate =
    stats.totalCustomers > 0
      ? ((stats.customersWithOrders / stats.totalCustomers) * 100).toFixed(1)
      : "0"

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New This Month
            </CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.newCustomersThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">New registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.customersWithOrders} customers with orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>
            Customers with highest total spending
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customer data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topCustomers.map((customer, index) => (
                  <TableRow key={customer.userId || customer.email}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.userId ? (
                        <Link
                          href={`/admin/customers/${customer.userId}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">
                            {customer.name || "—"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                        </Link>
                      ) : (
                        <div>
                          <div className="font-medium">
                            {customer.name || "—"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.orderCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
