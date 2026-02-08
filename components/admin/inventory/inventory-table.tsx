"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import {
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  Minus,
  Plus,
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
import { adjustStock, updateLowStockThreshold } from "@/lib/actions/inventory"

interface InventoryItem {
  id: string
  variantId: string
  quantity: number
  reservedQuantity: number
  lowStockThreshold: number | null
  availableQuantity: number
  isLowStock: boolean
  isOutOfStock: boolean
  variantName: string
  variantSku: string
  variantPrice: string
  productId: string
  productName: string
  productSlug: string
}

interface InventoryTableProps {
  items: InventoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  search: string
  stockStatus: string
}

export function InventoryTable({
  items,
  pagination,
  search,
  stockStatus,
}: InventoryTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [isPending, startTransition] = useTransition()

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustment, setAdjustment] = useState(0)
  const [adjustReason, setAdjustReason] = useState("")
  const [newThreshold, setNewThreshold] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.delete("page") // Reset to page 1 on filter change
    startTransition(() => {
      router.push(`/admin/inventory?${params.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilters({ search: searchValue })
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    startTransition(() => {
      router.push(`/admin/inventory?${params.toString()}`)
    })
  }

  async function handleAdjustStock() {
    if (!selectedItem || adjustment === 0 || !adjustReason.trim()) {
      toast.error("Please provide adjustment quantity and reason")
      return
    }

    setIsSubmitting(true)
    const result = await adjustStock({
      inventoryItemId: selectedItem.id,
      adjustment,
      reason: adjustReason,
    })
    setIsSubmitting(false)

    if (result.success && "previousQuantity" in result) {
      toast.success(
        `Stock adjusted: ${result.previousQuantity} → ${result.newQuantity}`,
      )
      setAdjustDialogOpen(false)
      setAdjustment(0)
      setAdjustReason("")
      setSelectedItem(null)
      router.refresh()
    } else if (!result.success) {
      toast.error(result.error || "Failed to adjust stock")
    }
  }

  async function handleUpdateThreshold() {
    if (!selectedItem) return

    setIsSubmitting(true)
    const result = await updateLowStockThreshold(selectedItem.id, newThreshold)
    setIsSubmitting(false)

    if (result.success) {
      toast.success("Low stock threshold updated")
      setThresholdDialogOpen(false)
      setSelectedItem(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update threshold")
    }
  }

  function getStockBadge(item: InventoryItem) {
    if (item.isOutOfStock) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (item.isLowStock) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Low Stock
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        In Stock
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products or SKU..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 w-62.5"
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
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="normal">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product / SKU</TableHead>
              <TableHead className="text-center">Available</TableHead>
              <TableHead className="text-center">Reserved</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Threshold</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/admin/products/${item.productId}/edit`}
                        className="font-medium hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.variantName} • {item.variantSku}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.availableQuantity}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {item.reservedQuantity}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">
                    {item.lowStockThreshold || 5}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockBadge(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item)
                          setAdjustment(0)
                          setAdjustReason("")
                          setAdjustDialogOpen(true)
                        }}
                        title="Adjust Stock"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item)
                          setNewThreshold(item.lowStockThreshold || 5)
                          setThresholdDialogOpen(true)
                        }}
                        title="Set Threshold"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="View History"
                      >
                        <Link href={`/admin/inventory/${item.id}/history`}>
                          <History className="h-4 w-4" />
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} items
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

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  Adjust stock for {selectedItem.productName} (
                  {selectedItem.variantSku})
                  <br />
                  Current stock: {selectedItem.quantity}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Adjustment</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustment((a) => a - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                  className="w-24 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustment((a) => a + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                New stock will be:{" "}
                <strong>
                  {selectedItem ? selectedItem.quantity + adjustment : 0}
                </strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for adjustment..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
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
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Threshold Dialog */}
      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Low Stock Threshold</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  Set the low stock alert threshold for{" "}
                  {selectedItem.productName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold Quantity</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                value={newThreshold}
                onChange={(e) => setNewThreshold(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                You&apos;ll be alerted when available stock falls below this
                number
              </p>
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
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Threshold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
