"use client"

import { Fragment, useDeferredValue, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import type {
  AdminOrderFulfillmentStatus,
  AdminOrderListItem,
  AdminOrderListView,
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from "@/lib/types/admin-order"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

type OrderSortField =
  | "createdAt"
  | "updatedAt"
  | "latestActivityAt"
  | "total"
  | "customer"
  | "paymentStatus"
  | "fulfillmentStatus"
  | "orderNumber"

interface OrdersTableProps {
  orders: AdminOrderListItem[]
  total: number
  page: number
  totalPages: number
  search: string
  status: AdminOrderStatus | ""
  paymentStatus: AdminOrderPaymentStatus | ""
  fulfillmentStatus: AdminOrderFulfillmentStatus | ""
  customerType: "all" | "guest" | "registered"
  shippingMethod: string
  view: AdminOrderListView
  sortBy: OrderSortField
  sortOrder: "asc" | "desc"
  isLoading?: boolean
  errorMessage?: string | null
  onRefetch?: () => Promise<unknown>
}

const ORDER_VIEWS: Array<{ value: AdminOrderListView; label: string }> = [
  { value: "all", label: "All" },
  { value: "needs_payment_review", label: "Needs Payment Review" },
  { value: "awaiting_processing", label: "Awaiting Processing" },
  { value: "needs_serial_assignment", label: "Needs Serial Assignment" },
  { value: "ready_to_ship", label: "Ready to Ship" },
  { value: "delivered", label: "Delivered" },
  { value: "exceptions", label: "Exceptions" },
]

function PaymentStatusBadge({ status }: { status: AdminOrderPaymentStatus }) {
  const className =
    status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status === "pending_verification"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : status === "authorized"
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : status === "failed" || status === "cancelled"
            ? "border-red-200 bg-red-50 text-red-900"
            : status === "refunded"
              ? "border-orange-200 bg-orange-50 text-orange-900"
              : "border-border/80 bg-background text-foreground"

  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {status.replaceAll("_", " ")}
    </Badge>
  )
}

function FulfillmentStatusBadge({
  status,
}: {
  status: AdminOrderFulfillmentStatus
}) {
  const className =
    status === "delivered"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status === "shipped"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : status === "packing"
          ? "border-violet-200 bg-violet-50 text-violet-900"
          : status === "processing"
            ? "border-indigo-200 bg-indigo-50 text-indigo-900"
            : status === "cancelled"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-border/80 bg-background text-foreground"

  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {status.replaceAll("_", " ")}
    </Badge>
  )
}

function AttentionBadge({
  state,
}: {
  state: AdminOrderListItem["progress"]["attentionState"]
}) {
  if (!state) {
    return <Badge variant="outline">Healthy</Badge>
  }

  const className =
    state === "ready_to_ship"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : state === "needs_payment_review"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : state === "needs_serial_assignment"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : state === "awaiting_processing"
            ? "border-sky-200 bg-sky-50 text-sky-900"
            : "border-red-200 bg-red-50 text-red-900"

  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {state.replaceAll("_", " ")}
    </Badge>
  )
}

export function OrdersTable({
  orders,
  total,
  page,
  totalPages,
  search,
  status,
  paymentStatus,
  fulfillmentStatus,
  customerType,
  shippingMethod,
  view,
  sortBy,
  sortOrder,
  isLoading = false,
  errorMessage = null,
}: OrdersTableProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)
  const deferredSearch = useDeferredValue(searchValue)
  const [isPending, startTransition] = useTransition()

  function buildHref(
    overrides: Partial<{
      page: number
      search: string
      status: AdminOrderStatus | ""
      paymentStatus: AdminOrderPaymentStatus | ""
      fulfillmentStatus: AdminOrderFulfillmentStatus | ""
      customerType: "all" | "guest" | "registered"
      shippingMethod: string
      view: AdminOrderListView
      sortBy: OrderSortField
      sortOrder: "asc" | "desc"
    }> = {},
  ) {
    const params = new URLSearchParams()
    const nextSearch = overrides.search ?? search
    const nextStatus = overrides.status ?? status
    const nextPaymentStatus = overrides.paymentStatus ?? paymentStatus
    const nextFulfillmentStatus =
      overrides.fulfillmentStatus ?? fulfillmentStatus
    const nextCustomerType = overrides.customerType ?? customerType
    const nextShippingMethod = overrides.shippingMethod ?? shippingMethod
    const nextView = overrides.view ?? view
    const nextSortBy = overrides.sortBy ?? sortBy
    const nextSortOrder = overrides.sortOrder ?? sortOrder
    const nextPage = overrides.page ?? page

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim())
    }

    if (nextStatus) {
      params.set("status", nextStatus)
    }

    if (nextPaymentStatus) {
      params.set("paymentStatus", nextPaymentStatus)
    }

    if (nextFulfillmentStatus) {
      params.set("fulfillmentStatus", nextFulfillmentStatus)
    }

    if (nextCustomerType !== "all") {
      params.set("customerType", nextCustomerType)
    }

    if (nextShippingMethod.trim()) {
      params.set("shippingMethod", nextShippingMethod.trim())
    }

    if (nextView !== "all") {
      params.set("view", nextView)
    }

    if (nextSortBy !== "createdAt") {
      params.set("sortBy", nextSortBy)
    }

    if (!(nextSortBy === "createdAt" && nextSortOrder === "desc")) {
      params.set("sortOrder", nextSortOrder)
    }

    if (nextPage > 1) {
      params.set("page", nextPage.toString())
    }

    const query = params.toString()
    return query ? `/ops/orders?${query}` : "/ops/orders"
  }

  function updateFilters(
    updates: Partial<{
      search: string
      status: AdminOrderStatus | ""
      paymentStatus: AdminOrderPaymentStatus | ""
      fulfillmentStatus: AdminOrderFulfillmentStatus | ""
      customerType: "all" | "guest" | "registered"
      shippingMethod: string
      view: AdminOrderListView
    }>,
  ) {
    startTransition(() => {
      router.push(
        buildHref({
          page: 1,
          search: updates.search ?? search,
          status: updates.status ?? status,
          paymentStatus: updates.paymentStatus ?? paymentStatus,
          fulfillmentStatus: updates.fulfillmentStatus ?? fulfillmentStatus,
          customerType: updates.customerType ?? customerType,
          shippingMethod: updates.shippingMethod ?? shippingMethod,
          view: updates.view ?? view,
        }),
      )
    })
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    updateFilters({ search: deferredSearch.trim() })
  }

  function goToPage(nextPage: number) {
    startTransition(() => {
      router.push(buildHref({ page: nextPage }))
    })
  }

  function toggleSort(field: OrderSortField) {
    const nextOrder =
      sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc"

    startTransition(() => {
      router.push(
        buildHref({
          page: 1,
          sortBy: field,
          sortOrder: nextOrder,
        }),
      )
    })
  }

  function renderSortIcon(field: OrderSortField) {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    }

    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    )
  }

  function renderSortableHead(
    label: string,
    field: OrderSortField,
    className?: string,
  ) {
    return (
      <TableHead className={className}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          onClick={() => toggleSort(field)}
        >
          {label}
          {renderSortIcon(field)}
        </Button>
      </TableHead>
    )
  }

  function getPaginationItems() {
    const pages = new Set<number>([1, totalPages, page - 1, page, page + 1])

    return [...pages]
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((left, right) => left - right)
  }

  const startItem = total === 0 ? 0 : (page - 1) * 20 + 1
  const endItem = Math.min(page * 20, total)

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {ORDER_VIEWS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={view === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ view: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,0.7fr))]">
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 gap-2 xl:col-span-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order, customer, SKU, tracking..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={isPending}>
              Search
            </Button>
          </form>

          <Select
            value={paymentStatus || "all"}
            onValueChange={(value) =>
              updateFilters({
                paymentStatus:
                  value === "all" ? "" : (value as AdminOrderPaymentStatus),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="pending_verification">
                Pending verification
              </SelectItem>
              <SelectItem value="authorized">Authorized</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={fulfillmentStatus || "all"}
            onValueChange={(value) =>
              updateFilters({
                fulfillmentStatus:
                  value === "all" ? "" : (value as AdminOrderFulfillmentStatus),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Fulfillment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fulfillment</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="packing">Preparing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={customerType}
            onValueChange={(value) =>
              updateFilters({
                customerType: value as "all" | "guest" | "registered",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Customer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status || "all"}
            onValueChange={(value) =>
              updateFilters({
                status: value === "all" ? "" : (value as AdminOrderStatus),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Lifecycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lifecycle</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_payment">Pending payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="packing">Preparing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow>
              {renderSortableHead("Order", "orderNumber")}
              {renderSortableHead("Customer", "customer")}
              <TableHead className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Items
              </TableHead>
              {renderSortableHead("Payment", "paymentStatus")}
              {renderSortableHead("Fulfillment", "fulfillmentStatus")}
              <TableHead className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Readiness
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Shipment
              </TableHead>
              {renderSortableHead("Latest Activity", "latestActivityAt")}
              <TableHead className="w-20 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground"
                >
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground"
                >
                  No orders matched these filters.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <Link
                        href={`/ops/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Placed{" "}
                        {formatDate(order.createdAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="capitalize">
                          {order.paymentMethod?.replaceAll("_", " ") ||
                            "Unknown"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {order.shippingMethod.replaceAll("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {order.customerName || order.customerEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerEmail}
                      </p>
                      {order.customerPhone ? (
                        <p className="text-xs text-muted-foreground">
                          {order.customerPhone}
                        </p>
                      ) : null}
                      <Badge variant="outline">
                        {order.isGuest ? "Guest" : "Registered"}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {order.itemCount} line{order.itemCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {order.totalQuantity} unit
                        {order.totalQuantity !== 1 ? "s" : ""}
                      </p>
                      <p className="font-medium">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="space-y-2">
                      <PaymentStatusBadge status={order.paymentStatus} />
                      {order.paymentMethod === "bank_transfer" ? (
                        <AttentionBadge state={order.progress.attentionState} />
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="space-y-2">
                      <FulfillmentStatusBadge
                        status={order.fulfillmentStatus}
                      />
                      <Badge variant="outline" className="capitalize">
                        {order.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="space-y-2 text-sm">
                      <AttentionBadge state={order.progress.attentionState} />
                      <p className="text-muted-foreground">
                        {order.progress.readyLines}/{order.progress.totalLines}{" "}
                        lines ready
                      </p>
                      {order.progress.serialLines > 0 ? (
                        <p className="text-muted-foreground">
                          Serial: {order.progress.serialAssignedUnits}/
                          {order.progress.serialRequiredUnits}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          Prepared: {order.progress.allocatedQuantityUnits}/
                          {order.progress.committedQuantityUnits}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    {order.latestTrackingNumber ? (
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">
                          {order.latestCarrier || "Shipment created"}
                        </p>
                        <p className="text-muted-foreground">
                          {order.latestTrackingNumber}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No shipment yet
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="align-top text-sm text-muted-foreground">
                    {formatDate(order.latestActivityAt, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>

                  <TableCell className="align-top text-right">
                    <Button variant="ghost" size="sm" asChild className="h-9">
                      <Link href={`/ops/orders/${order.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} orders
        </p>
        <Pagination className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildHref({ page: Math.max(1, page - 1) })}
                onClick={(event) => {
                  event.preventDefault()
                  if (page > 1 && !isPending) {
                    goToPage(page - 1)
                  }
                }}
                aria-disabled={page <= 1 || isPending}
                className={
                  page <= 1 || isPending ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {getPaginationItems().map((pageNumber, index, pages) => (
              <Fragment key={pageNumber}>
                {index > 0 && pageNumber - pages[index - 1] > 1 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <PaginationLink
                    href={buildHref({ page: pageNumber })}
                    isActive={pageNumber === page}
                    onClick={(event) => {
                      event.preventDefault()
                      if (!isPending && pageNumber !== page) {
                        goToPage(pageNumber)
                      }
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              </Fragment>
            ))}

            <PaginationItem>
              <PaginationNext
                href={buildHref({ page: Math.min(totalPages, page + 1) })}
                onClick={(event) => {
                  event.preventDefault()
                  if (page < totalPages && !isPending) {
                    goToPage(page + 1)
                  }
                }}
                aria-disabled={page >= totalPages || isPending}
                className={
                  page >= totalPages || isPending
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
