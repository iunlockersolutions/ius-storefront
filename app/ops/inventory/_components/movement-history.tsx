"use client"

import { useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

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
import type { AdminInventoryTransaction } from "@/lib/types/admin-inventory"

interface MovementHistoryProps {
  movements: AdminInventoryTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const TYPE_LABELS: Record<string, string> = {
  receipt: "Receipt",
  adjustment_increase: "Adjust +",
  adjustment_decrease: "Adjust -",
  return: "Return",
  reservation: "Reserve",
  reservation_release: "Release Reservation",
  allocation: "Allocate",
  allocation_release: "Release Allocation",
  shipment: "Shipment",
  damage: "Damage",
  loss: "Loss",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
}

const TYPE_COLORS: Record<string, string> = {
  receipt: "bg-green-100 text-green-800",
  adjustment_increase: "bg-emerald-100 text-emerald-800",
  adjustment_decrease: "bg-yellow-100 text-yellow-800",
  return: "bg-purple-100 text-purple-800",
  reservation: "bg-orange-100 text-orange-800",
  reservation_release: "bg-cyan-100 text-cyan-800",
  allocation: "bg-blue-100 text-blue-800",
  allocation_release: "bg-slate-100 text-slate-800",
  shipment: "bg-indigo-100 text-indigo-800",
  damage: "bg-rose-100 text-rose-800",
  loss: "bg-red-100 text-red-800",
  transfer_in: "bg-lime-100 text-lime-800",
  transfer_out: "bg-amber-100 text-amber-800",
}

export function MovementHistory({
  movements,
  pagination,
}: MovementHistoryProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function goToPage(page: number) {
    const params = new URLSearchParams()

    if (page > 1) {
      params.set("page", page.toString())
    }

    startTransition(() => {
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  function formatDate(date: string | Date) {
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
              <TableHead className="text-center">Change</TableHead>
              <TableHead className="text-center">Before â†’ After</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Actor</TableHead>
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
                <TableCell className="text-center">
                  <span
                    className={`font-medium ${
                      movement.quantityDelta > 0
                        ? "text-green-600"
                        : movement.quantityDelta < 0
                          ? "text-red-600"
                          : ""
                    }`}
                  >
                    {movement.quantityDelta > 0 ? "+" : ""}
                    {movement.quantityDelta}
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {movement.beforeOnHandQuantity} â†’{" "}
                  {movement.afterOnHandQuantity}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {movement.referenceType && (
                    <span className="capitalize">
                      {movement.referenceType.replace("_", " ")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {movement.performedByName || "System"}
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
