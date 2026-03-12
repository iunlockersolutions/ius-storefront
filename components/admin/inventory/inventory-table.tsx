"use client"

import { useDeferredValue, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  useAdjustStockMutation,
  useUpdateLowStockThresholdMutation,
} from "@/hooks/admin/use-inventory-mutations"
import type { AdminInventoryListItem } from "@/lib/types/admin-inventory"

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
  isLoading?: boolean
  errorMessage?: string | null
  onRefetch?: () => Promise<unknown>
}

export function InventoryTable({
  items,
  pagination,
  search,
  stockStatus,
  isLoading = false,
  errorMessage = null,
  onRefetch,
}: InventoryTableProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState("")
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

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams()

    if (search) {
      params.set("search", search)
    }

    if (stockStatus && stockStatus !== "all") {
      params.set("status", stockStatus)
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.delete("page")
    startTransition(() => {
      router.push(`/ops/inventory?${params.toString()}`)
    })
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    updateFilters({ search: deferredSearch.trim() })
  }

  function goToPage(page: number) {
    const params = new URLSearchParams()

    if (search) {
      params.set("search", search)
    }

    if (stockStatus && stockStatus !== "all") {
      params.set("status", stockStatus)
    }

    if (page > 1) {
      params.set("page", page.toString())
    }

    startTransition(() => {
      router.push(`/ops/inventory?${params.toString()}`)
    })
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product, variant, or SKU..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-72 pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isPending}>
            Search
          </Button>
        </form>

        <Select
          value={stockStatus}
          onValueChange={(value) => updateFilters({ status: value })}
        >
          <SelectTrigger className="w-44">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product / SKU</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-center">Available</TableHead>
              <TableHead className="text-center">Reserved</TableHead>
              <TableHead className="text-center">Allocated</TableHead>
              <TableHead className="text-center">On Hand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                        {item.variantName} • {item.variantSku}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="capitalize">
                        {item.trackingMode}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {item.locationCount} location
                        {item.locationCount === 1 ? "" : "s"}
                      </p>
                    </div>
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
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/ops/inventory/${item.variantId}`}>
                          Details
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/ops/inventory/${item.variantId}?tab=receipts`}
                        >
                          <ScanBarcode className="mr-1 h-4 w-4" />
                          Receive
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item)
                          setAdjustment(0)
                          setAdjustReason("")
                          setAdjustDialogOpen(true)
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Adjust
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item)
                          setNewThreshold(item.lowStockThreshold)
                          setThresholdDialogOpen(true)
                        }}
                      >
                        <Settings className="mr-1 h-4 w-4" />
                        Threshold
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/ops/inventory/${item.variantId}/history`}>
                          <History className="mr-1 h-4 w-4" />
                          History
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} variants
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || isPending}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isPending}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

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
