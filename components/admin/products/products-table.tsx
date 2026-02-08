"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Eye, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"

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

interface Product {
  id: string
  name: string
  slug: string
  basePrice: string
  status: "draft" | "active" | "archived"
  isFeatured: boolean
  createdAt: Date
}

interface ProductsTableProps {
  products: Product[]
  total: number
  page: number
  totalPages: number
  search: string
  status: string
}

export function ProductsTable({
  products,
  total,
  page,
  totalPages,
  search,
  status,
}: ProductsTableProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchInput) params.set("search", searchInput)
    if (status) params.set("status", status)
    params.set("page", "1")
    router.push(`/admin/products?${params.toString()}`)
  }

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value && value !== "all") params.set("status", value)
    params.set("page", "1")
    router.push(`/admin/products?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    params.set("page", newPage.toString())
    router.push(`/admin/products?${params.toString()}`)
  }

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    archived: "bg-neutral-100 text-neutral-800",
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search products..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(parseFloat(product.basePrice))}
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
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
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
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
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
