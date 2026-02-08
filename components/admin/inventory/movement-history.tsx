"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Movement {
  id: string
  type: string
  quantity: number
  previousQuantity: number
  newQuantity: number
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  createdAt: Date
  inventoryItemId: string
  variantName: string
  variantSku: string
  productName: string
}

interface MovementHistoryProps {
  movements: Movement[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const TYPE_LABELS: Record<string, string> = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment: "Adjustment",
  return: "Return",
  reserved: "Reserved",
  released: "Released",
}

const TYPE_COLORS: Record<string, string> = {
  purchase: "bg-green-100 text-green-800",
  sale: "bg-blue-100 text-blue-800",
  adjustment: "bg-yellow-100 text-yellow-800",
  return: "bg-purple-100 text-purple-800",
  reserved: "bg-orange-100 text-orange-800",
  released: "bg-cyan-100 text-cyan-800",
}

export function MovementHistory({
  movements,
  pagination,
}: MovementHistoryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No movement history found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Change</TableHead>
              <TableHead className="text-center">Before → After</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-sm">
                  {formatDate(movement.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={TYPE_COLORS[movement.type] || ""}
                  >
                    {TYPE_LABELS[movement.type] || movement.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{movement.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {movement.variantSku}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`font-medium ${
                      movement.quantity > 0
                        ? "text-green-600"
                        : movement.quantity < 0
                          ? "text-red-600"
                          : ""
                    }`}
                  >
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity}
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {movement.previousQuantity} → {movement.newQuantity}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {movement.referenceType && (
                    <span className="capitalize">
                      {movement.referenceType.replace("_", " ")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm max-w-50 truncate">
                  {movement.notes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} movements
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
