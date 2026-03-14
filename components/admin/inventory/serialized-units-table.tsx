"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search } from "lucide-react"

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
import { useAdminInventoryUnitsQuery } from "@/hooks/admin/use-admin-inventory-units-query"
import type {
  AdminInventoryIdentifierType,
  AdminInventorySortOrder,
  AdminInventoryUnit,
  AdminInventoryUnitIdentifierFilter,
  AdminInventoryUnitSortField,
  AdminInventoryUnitStatus,
} from "@/lib/types/admin-inventory"

interface SerializedUnitsTableProps {
  variantId: string
  receiptIdentifierTypes: AdminInventoryIdentifierType[]
  totalUnits: number
}

const STATUS_LABELS: Record<AdminInventoryUnitStatus, string> = {
  received: "Received",
  available: "Available",
  reserved: "Reserved",
  allocated: "Allocated",
  packed: "Packed",
  shipped: "Shipped",
  returned: "Returned",
  damaged: "Damaged",
  lost: "Lost",
}

const STATUS_TONE: Record<AdminInventoryUnitStatus, string> = {
  received: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
  available:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  reserved:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  allocated:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200",
  packed: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200",
  shipped:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
  returned: "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-200",
  damaged: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  lost: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200",
}

const STATUS_OPTIONS: Array<{
  label: string
  value: AdminInventoryUnitStatus | "all"
}> = [
  { label: "All statuses", value: "all" },
  { label: "Received", value: "received" },
  { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" },
  { label: "Allocated", value: "allocated" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Returned", value: "returned" },
  { label: "Damaged", value: "damaged" },
  { label: "Lost", value: "lost" },
]

const IDENTIFIER_LABELS: Record<AdminInventoryIdentifierType, string> = {
  serial: "Serial",
  imei: "IMEI",
  imei2: "IMEI 2",
  barcode: "Barcode",
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function renderSortIcon(sorted: false | "asc" | "desc") {
  if (sorted === "asc") {
    return <ArrowUp className="h-3.5 w-3.5" />
  }

  if (sorted === "desc") {
    return <ArrowDown className="h-3.5 w-3.5" />
  }

  return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
}

function getPaginationItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])

  return [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right)
}

function getColumnSort(
  columnId: string,
  sortBy: AdminInventoryUnitSortField,
  sortOrder: AdminInventorySortOrder,
): false | "asc" | "desc" {
  const field =
    columnId === "primaryIdentifier"
      ? "identifier"
      : columnId === "receivedAt"
        ? "received"
        : columnId === "updatedAt"
          ? "updated"
          : columnId === "status"
            ? "status"
            : null

  if (!field || field !== sortBy) {
    return false
  }

  return sortOrder
}

function getSortField(columnId: string): AdminInventoryUnitSortField {
  if (columnId === "primaryIdentifier") {
    return "identifier"
  }

  if (columnId === "status") {
    return "status"
  }

  if (columnId === "receivedAt") {
    return "received"
  }

  return "updated"
}

export function SerializedUnitsTable({
  variantId,
  receiptIdentifierTypes,
  totalUnits,
}: SerializedUnitsTableProps) {
  const [searchValue, setSearchValue] = useState("")
  const deferredSearchValue = useDeferredValue(searchValue)
  const [status, setStatus] = useState<AdminInventoryUnitStatus | "all">("all")
  const [identifierType, setIdentifierType] =
    useState<AdminInventoryUnitIdentifierFilter>("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState<AdminInventoryUnitSortField>("updated")
  const [sortOrder, setSortOrder] = useState<AdminInventorySortOrder>("desc")

  const deferredSearch = deferredSearchValue.trim()

  useEffect(() => {
    setPage(1)
  }, [deferredSearch, status, identifierType, limit, sortBy, sortOrder])

  const unitsQuery = useAdminInventoryUnitsQuery({
    variantId,
    page,
    limit,
    search: deferredSearch,
    status,
    identifierType,
    sortBy,
    sortOrder,
  })

  const data = unitsQuery.data?.units ?? []
  const pagination = unitsQuery.data?.pagination ?? {
    page,
    limit,
    total: totalUnits,
    totalPages: Math.max(1, Math.ceil(Math.max(totalUnits, 1) / limit)),
  }

  const sorting = useMemo<SortingState>(
    () => [
      {
        id:
          sortBy === "identifier"
            ? "primaryIdentifier"
            : sortBy === "received"
              ? "receivedAt"
              : sortBy === "status"
                ? "status"
                : "updatedAt",
        desc: sortOrder === "desc",
      },
    ],
    [sortBy, sortOrder],
  )

  const columns = useMemo<ColumnDef<AdminInventoryUnit>[]>(
    () => [
      {
        accessorKey: "primaryIdentifier",
        id: "primaryIdentifier",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            onClick={column.getToggleSortingHandler()}
          >
            Primary Identifier
            {renderSortIcon(column.getIsSorted())}
          </Button>
        ),
        cell: ({ row }) => {
          const unit = row.original

          return (
            <div className="min-w-[14rem] space-y-1">
              <div className="font-medium">
                {unit.primaryIdentifier?.value ?? "No primary identifier"}
              </div>
              <p className="text-xs text-muted-foreground">
                {unit.primaryIdentifier
                  ? IDENTIFIER_LABELS[unit.primaryIdentifier.type]
                  : "This unit has not been tagged yet."}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: "identifiers",
        id: "identifiers",
        header: "Identifier Summary",
        cell: ({ row }) => {
          const unit = row.original
          const extraIdentifiers = unit.identifiers.filter(
            (identifier) => identifier.id !== unit.primaryIdentifier?.id,
          )

          if (extraIdentifiers.length === 0) {
            return (
              <span className="text-sm text-muted-foreground">
                No extra identifiers
              </span>
            )
          }

          return (
            <div className="flex min-w-[16rem] flex-wrap gap-2">
              {extraIdentifiers.map((identifier) => (
                <Badge
                  key={identifier.id}
                  variant="secondary"
                  className="max-w-full gap-1 truncate"
                >
                  <span className="shrink-0 uppercase">
                    {IDENTIFIER_LABELS[identifier.type]}
                  </span>
                  <span className="truncate">{identifier.value}</span>
                </Badge>
              ))}
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            onClick={column.getToggleSortingHandler()}
          >
            Status
            {renderSortIcon(column.getIsSorted())}
          </Button>
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={STATUS_TONE[row.original.status]}
          >
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "receivedAt",
        id: "receivedAt",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            onClick={column.getToggleSortingHandler()}
          >
            Received
            {renderSortIcon(column.getIsSorted())}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[11rem] text-sm text-muted-foreground">
            {formatDate(row.original.receivedAt)}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        id: "updatedAt",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            onClick={column.getToggleSortingHandler()}
          >
            Updated
            {renderSortIcon(column.getIsSorted())}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[11rem] text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt)}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        id: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <div className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
            {row.original.notes || "No notes recorded."}
          </div>
        ),
      },
    ],
    [],
  )

  // TanStack Table manages imperative table helpers internally, so this hook is
  // intentionally used here for a server-driven data grid.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.totalPages,
    rowCount: pagination.total,
    state: {
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
      sorting,
    },
    onPaginationChange: (updater) => {
      const nextPagination: PaginationState =
        typeof updater === "function"
          ? updater({
              pageIndex: pagination.page - 1,
              pageSize: pagination.limit,
            })
          : updater

      if (nextPagination.pageSize !== limit) {
        setLimit(nextPagination.pageSize)
      }

      if (nextPagination.pageIndex + 1 !== page) {
        setPage(nextPagination.pageIndex + 1)
      }
    },
    onSortingChange: (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater
      const next = nextSorting[0]

      if (!next) {
        setSortBy("updated")
        setSortOrder("desc")
        return
      }

      setSortBy(getSortField(next.id))
      setSortOrder(next.desc ? "desc" : "asc")
    },
  })

  const identifierOptions = receiptIdentifierTypes.map((type) => ({
    value: type,
    label: IDENTIFIER_LABELS[type],
  }))

  const hasNoUnits = totalUnits === 0
  const hasActiveFilters =
    Boolean(deferredSearch) || status !== "all" || identifierType !== "all"

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Serialized Units
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Search by identifier, narrow the list by unit status, and sort by
              the latest movement to find the exact device you need before you
              receive, reserve, or investigate stock.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {unitsQuery.isFetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating list
              </>
            ) : (
              `${pagination.total} unit${pagination.total === 1 ? "" : "s"}`
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-y py-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search serials, IMEIs, barcodes, or notes..."
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as AdminInventoryUnitStatus | "all")
          }
        >
          <SelectTrigger className="w-full lg:w-[12rem]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={identifierType}
          onValueChange={(value) =>
            setIdentifierType(value as AdminInventoryUnitIdentifierFilter)
          }
        >
          <SelectTrigger className="w-full lg:w-[12rem]">
            <SelectValue placeholder="All identifiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All identifiers</SelectItem>
            {identifierOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(value) => setLimit(Number(value))}
        >
          <SelectTrigger className="w-full lg:w-[9rem]">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {unitsQuery.error ? (
        <div className="flex flex-col gap-3 border-b pb-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            We could not load the serialized units right now. Try again to see
            the latest device list.
          </p>
          <Button variant="outline" onClick={() => void unitsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {unitsQuery.isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-12 text-center text-muted-foreground"
              >
                Loading serialized units...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-12 text-center text-muted-foreground"
              >
                <div className="mx-auto flex max-w-md flex-col items-center gap-3 whitespace-normal">
                  <p className="text-base font-medium text-foreground">
                    {hasNoUnits
                      ? "No serialized units have been received for this variant yet."
                      : "No serialized units found for the current filters."}
                  </p>
                  <p>
                    {hasNoUnits
                      ? "Use Receive Stock to add devices and start tracking them individually."
                      : hasActiveFilters
                        ? "Try clearing a filter or broadening your search to bring matching units back into view."
                        : "Try refreshing the page to fetch the latest unit state."}
                  </p>
                  {hasNoUnits ? (
                    <Button asChild size="sm">
                      <Link href={`/ops/inventory/${variantId}?tab=receipts`}>
                        Receive Stock
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-4 border-t py-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          {pagination.total === 0
            ? 0
            : (pagination.page - 1) * pagination.limit + 1}{" "}
          to {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} serialized units
        </p>

        {pagination.totalPages > 1 ? (
          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (pagination.page > 1) {
                      setPage(pagination.page - 1)
                    }
                  }}
                  aria-disabled={pagination.page <= 1}
                  className={
                    pagination.page <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {getPaginationItems(pagination.page, pagination.totalPages).map(
                (pageNumber, index, pages) => (
                  <div key={pageNumber} className="contents">
                    {index > 0 && pageNumber - pages[index - 1] > 1 ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === pagination.page}
                        onClick={(event) => {
                          event.preventDefault()
                          setPage(pageNumber)
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (pagination.page < pagination.totalPages) {
                      setPage(pagination.page + 1)
                    }
                  }}
                  aria-disabled={pagination.page >= pagination.totalPages}
                  className={
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </section>
  )
}
