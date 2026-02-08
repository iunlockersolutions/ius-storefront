"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Customer {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  orderCount: number
  totalSpent: number
}

interface CustomersTableProps {
  customers: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  search: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return email.charAt(0).toUpperCase()
}

export function CustomersTable({
  customers,
  pagination,
  search,
}: CustomersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }
    params.delete("page")
    startTransition(() => {
      router.push(`/admin/customers?${params.toString()}`)
    })
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    startTransition(() => {
      router.push(`/admin/customers?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          Search
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={customer.image || undefined} />
                        <AvatarFallback>
                          {getInitials(customer.name, customer.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {customer.name || "No name"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    {customer.orderCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="text-center">
                    {customer.emailVerified ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/customers/${customer.id}`}>
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
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} customers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
