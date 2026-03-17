"use client"

import { Fragment, useDeferredValue, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  History,
  Loader2,
  MoreHorizontal,
  Plus,
  ScanBarcode,
  Search,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import type {
  AdminInventoryListItem,
  AdminInventorySortField,
  AdminInventorySortOrder,
} from "@/lib/types/admin-inventory"
import {
  useAdjustStockMutation,
  useUpdateLowStockThresholdMutation,
} from "@/services/mutations/use-inventory-mutations"

interface InventoryTableProps {
  items: AdminInventoryListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  search: string
  stockStatus: string
  sortBy: AdminInventorySortField
  sortOrder: AdminInventorySortOrder
  isLoading?: boolean
  errorMessage?: string | null
  onRefetch?: () => Promise<unknown>
}

export function InventoryTable({
  items,
  pagination,
  search,
  stockStatus,
  sortBy,
  sortOrder,
  isLoading = false,
  errorMessage = null,
  onRefetch,
}: InventoryTableProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)
  const deferredSearch = useDeferredValue(searchValue)
  const [isPending, startTransition] = useTransition()

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] =
    useState<AdminInventoryListItem | null>(null)
  const [adjustment, setAdjustment] = useState(0)
  const [adjustReason, setAdjustReason] = useState("")
  const [newThreshold, setNewThreshold] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const adjustStockMutation = useAdjustStockMutation()
  const updateThresholdMutation = useUpdateLowStockThresholdMutation()

  function buildHref(
    overrides: Partial<{
      page: number
      search: string
      status: string
      sortBy: AdminInventorySortField
      sortOrder: AdminInventorySortOrder
    }> = {},
  ) {
    const params = new URLSearchParams()
    const nextSearch = overrides.search ?? search
    const nextStatus = overrides.status ?? stockStatus
    const nextSortBy = overrides.sortBy ?? sortBy
    const nextSortOrder = overrides.sortOrder ?? sortOrder
    const nextPage = overrides.page ?? pagination.page

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim())
    }

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus)
    }

    if (nextSortBy !== "updated") {
      params.set("sortBy", nextSortBy)
    }

    if (!(nextSortBy === "updated" && nextSortOrder === "desc")) {
      params.set("sortOrder", nextSortOrder)
    }

    if (nextPage > 1) {
      params.set("page", nextPage.toString())
    }

    const query = params.toString()
    return query ? `/ops/inventory?${query}` : "/ops/inventory"
  }

  function updateFilters(updates: Record<string, string>) {
    startTransition(() => {
      router.push(
        buildHref({
          page: 1,
          search: updates.search ?? search,
          status: updates.status ?? stockStatus,
        }),
      )
    })
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    updateFilters({ search: deferredSearch.trim() })
  }

  function goToPage(page: number) {
    startTransition(() => {
      router.push(buildHref({ page }))
    })
  }

  function toggleSort(field: AdminInventorySortField) {
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

  function renderSortIcon(field: AdminInventorySortField) {
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
    field: AdminInventorySortField,
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
    const pages = new Set<number>([
      1,
      pagination.totalPages,
      pagination.page - 1,
      pagination.page,
      pagination.page + 1,
    ])

    return [...pages]
      .filter((value) => value >= 1 && value <= pagination.totalPages)
      .sort((left, right) => left - right)
  }

  async function handleAdjustStock() {
    if (!selectedItem || adjustment === 0 || !adjustReason.trim()) {
      toast.error("Please provide an adjustment and reason")
      return
    }

    if (selectedItem.trackingMode === "serial" && adjustment > 0) {
      toast.error("Use the receipt flow to add stock for serialized variants")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await adjustStockMutation.mutateAsync({
        variantId: selectedItem.variantId,
        adjustment,
        reason: adjustReason,
      })

      toast.success(
        `On-hand stock updated: ${result.previousQuantity} -> ${result.newQuantity}`,
      )
      setAdjustDialogOpen(false)
      setAdjustment(0)
      setAdjustReason("")
      setSelectedItem(null)
      if (onRefetch) {
        await onRefetch()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to adjust stock",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateThreshold() {
    if (!selectedItem) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateThresholdMutation.mutateAsync({
        variantId: selectedItem.variantId,
        threshold: newThreshold,
      })

      toast.success("Low stock threshold updated")
      setThresholdDialogOpen(false)
      setSelectedItem(null)
      if (onRefetch) {
        await onRefetch()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update threshold",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function getStockBadge(item: AdminInventoryListItem) {
    if (item.isOutOfStock) {
      return <Badge variant="destructive">Out</Badge>
    }

    if (item.isLowStock) {
      return (
        <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
          Low
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Healthy
      </Badge>
    )
  }

  function formatUpdatedAt(value: string | Date) {
    return new Date(value).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 md:flex-row md:items-center"
        >
          <div className="relative min-w-0 flex-1 md:min-w-88">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product, variant, or SKU..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-full pl-9"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={isPending}
            className="sm:shrink-0"
          >
            Search
          </Button>
        </form>

        <Select
          value={stockStatus}
          onValueChange={(value) => updateFilters({ status: value })}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="normal">Healthy</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              {renderSortableHead("Product", "product")}
              {renderSortableHead("SKU", "sku")}
              {renderSortableHead("Available", "available", "text-center")}
              {renderSortableHead("Reserved", "reserved", "text-center")}
              {renderSortableHead("Allocated", "allocated", "text-center")}
              {renderSortableHead("On Hand", "onHand", "text-center")}
              {renderSortableHead("Status", "status")}
              {renderSortableHead("Updated", "updated")}
              <TableHead className="w-12 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-muted-foreground"
                >
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-muted-foreground"
                >
                  No tracked variants found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/ops/products/${item.productId}/edit`}
                        className="font-medium hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.variantName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {item.variantSku}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.availableQuantity}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {item.reservedQuantity}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {item.allocatedQuantity}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.onHandQuantity}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStockBadge(item)}
                      <p className="text-xs text-muted-foreground">
                        Threshold {item.lowStockThreshold}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatUpdatedAt(item.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${item.productName}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/ops/inventory/${item.variantId}`}>
                            Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/ops/inventory/${item.variantId}?tab=receipts`}
                          >
                            <ScanBarcode className="mr-2 h-4 w-4" />
                            Receive
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedItem(item)
                            setAdjustment(0)
                            setAdjustReason("")
                            setAdjustDialogOpen(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adjust stock
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedItem(item)
                            setNewThreshold(item.lowStockThreshold)
                            setThresholdDialogOpen(true)
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Update threshold
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/ops/inventory/${item.variantId}/history`}
                          >
                            <History className="mr-2 h-4 w-4" />
                            History
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} variants
          </p>
          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={buildHref({ page: Math.max(1, pagination.page - 1) })}
                  onClick={(event) => {
                    event.preventDefault()
                    if (pagination.page > 1 && !isPending) {
                      goToPage(pagination.page - 1)
                    }
                  }}
                  aria-disabled={pagination.page <= 1 || isPending}
                  className={
                    pagination.page <= 1 || isPending
                      ? "pointer-events-none opacity-50"
                      : ""
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
                      isActive={pageNumber === pagination.page}
                      onClick={(event) => {
                        event.preventDefault()
                        if (!isPending) {
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
                  href={buildHref({
                    page: Math.min(pagination.totalPages, pagination.page + 1),
                  })}
                  onClick={(event) => {
                    event.preventDefault()
                    if (pagination.page < pagination.totalPages && !isPending) {
                      goToPage(pagination.page + 1)
                    }
                  }}
                  aria-disabled={
                    pagination.page >= pagination.totalPages || isPending
                  }
                  className={
                    pagination.page >= pagination.totalPages || isPending
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              {selectedItem ? (
                <>
                  {selectedItem.productName} • {selectedItem.variantSku}
                  <br />
                  On hand: {selectedItem.onHandQuantity}
                  {selectedItem.trackingMode === "serial"
                    ? " • serialized variants only support negative adjustments here"
                    : null}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment">Adjustment</Label>
              <Input
                id="adjustment"
                type="number"
                value={adjustment}
                onChange={(event) =>
                  setAdjustment(parseInt(event.target.value, 10) || 0)
                }
              />
              <p className="text-sm text-muted-foreground">
                New on-hand stock:{" "}
                <strong>
                  {selectedItem
                    ? selectedItem.onHandQuantity + adjustment
                    : adjustment}
                </strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this correction is needed"
                value={adjustReason}
                onChange={(event) => setAdjustReason(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={
                isSubmitting || adjustment === 0 || !adjustReason.trim()
              }
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Low Stock Threshold</DialogTitle>
            <DialogDescription>
              {selectedItem
                ? `Update the threshold for ${selectedItem.productName} (${selectedItem.variantSku}).`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                value={newThreshold}
                onChange={(event) =>
                  setNewThreshold(parseInt(event.target.value, 10) || 0)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setThresholdDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateThreshold} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
