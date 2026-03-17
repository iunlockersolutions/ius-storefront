"use client"

import { useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { formatCurrency } from "@/lib/utils"
import { useDeleteProductMutation } from "@/services/mutations/use-delete-product-mutation"

interface Product {
  id: string
  name: string
  slug: string
  basePrice: string
  status: "draft" | "active" | "archived"
  draftStep: "basics" | "organization" | "media" | "options" | "review"
  isFeatured: boolean
  brandName: string | null
  primaryCategoryName: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

interface ProductsTableProps {
  products: Product[]
  total: number
  page: number
  totalPages: number
  search: string
  status: string
  isLoading?: boolean
  errorMessage?: string | null
  onRefetch?: () => Promise<unknown>
}

export function ProductsTable({
  products,
  total,
  page,
  totalPages,
  search,
  status,
  isLoading = false,
  errorMessage = null,
  onRefetch,
}: ProductsTableProps) {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const deleteProductMutation = useDeleteProductMutation()

  const draftStepLabels = {
    basics: "Basics",
    organization: "Organization",
    media: "Media",
    options: "Options & Variants",
    review: "Review",
  } as const

  const handleSearch = () => {
    const searchInput = searchInputRef.current?.value.trim() || ""
    const params = new URLSearchParams()
    if (searchInput) params.set("search", searchInput)
    if (status) params.set("status", status)
    params.set("page", "1")
    router.push(`/ops/products?${params.toString()}`)
  }

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value && value !== "all") params.set("status", value)
    params.set("page", "1")
    router.push(`/ops/products?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    params.set("page", newPage.toString())
    router.push(`/ops/products?${params.toString()}`)
  }

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    archived: "bg-neutral-100 text-neutral-800",
  }

  const handleDelete = async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId)
      if (onRefetch) {
        await onRefetch()
      }
    } catch {
      // mutation hook exposes toast + error state externally if needed
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            key={search}
            ref={searchInputRef}
            placeholder="Search products..."
            defaultValue={search}
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/ops/products/new">
            <Plus className="h-4 w-4" />
            Create Product
          </Link>
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Primary Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-neutral-500"
                >
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-neutral-500"
                >
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-neutral-500">
                        {product.slug}
                      </div>
                      {product.status === "draft" ? (
                        <div className="text-xs text-neutral-500">
                          Resume at {draftStepLabels[product.draftStep]} Â· Last
                          saved{" "}
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(product.updatedAt))}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(parseFloat(product.basePrice))}
                  </TableCell>
                  <TableCell>{product.brandName || "Unbranded"}</TableCell>
                  <TableCell>
                    {product.primaryCategoryName || "Uncategorized"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[product.status]}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.isFeatured ? (
                      <Badge variant="outline">Featured</Badge>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-10 gap-2 px-3"
                          aria-label={`Actions for ${product.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sm:hidden">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/ops/products/${product.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {product.status === "draft"
                              ? "Resume Draft"
                              : "Edit"}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          Showing {products.length} of {total} products
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
