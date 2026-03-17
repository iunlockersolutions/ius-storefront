"use client"

import { useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ArrowLeft, RefreshCw, ScanBarcode } from "lucide-react"

import { InventoryOverviewTab } from "@/components/admin/inventory/inventory-overview-tab"
import { InventoryReceiptSessionCard } from "@/components/admin/inventory/inventory-receipt-session-card"
import {
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminInventoryDetailQuery } from "@/services/queries/use-admin-inventory-detail-query"

type InventoryTab = "overview" | "receipts" | "transactions"

interface InventoryDetailPageClientProps {
  variantId: string
  initialTab: InventoryTab
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function InventoryDetailPageClient({
  variantId,
  initialTab,
}: InventoryDetailPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const detailQuery = useAdminInventoryDetailQuery(variantId)

  function setTab(tab: InventoryTab) {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (tab === "overview") {
      nextParams.delete("tab")
    } else {
      nextParams.set("tab", tab)
    }

    startTransition(() => {
      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return <AdminQueryLoadingState skeletonClassName="h-[34rem] w-full" />
  }

  if (detailQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          detailQuery.error,
          "Failed to load inventory detail",
        )}
        onRetry={detailQuery.refetch}
        backHref="/ops/inventory"
        backLabel="Back to inventory"
      />
    )
  }

  const detail = detailQuery.data

  if (!detail) {
    return (
      <AdminQueryErrorState
        message="Inventory detail not found"
        backHref="/ops/inventory"
        backLabel="Back to inventory"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" asChild className="w-fit px-0">
            <Link href="/ops/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inventory
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{detail.productName}</h1>
            <p className="text-lg text-foreground">{detail.variantName}</p>
            <p className="text-muted-foreground">
              SKU {detail.variantSku} ·{" "}
              {detail.trackingMode === "serial"
                ? "Each physical unit is tracked individually, so staff can search by identifier and follow device-level history."
                : "Stock is tracked by quantity, so the overview focuses on counts, reservations, and replenishment signals."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {detail.trackingMode}
            </Badge>
            <Badge variant="outline">{detail.variantSku}</Badge>
            <Badge variant="secondary">
              Available {detail.stats.availableQuantity}
            </Badge>
            <Badge variant="secondary">
              Reserved {detail.stats.reservedQuantity}
            </Badge>
            <Badge variant="secondary">
              Allocated {detail.stats.allocatedQuantity}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void detailQuery.refetch()}
            disabled={detailQuery.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${detailQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild>
            <Link href={`/ops/inventory/${variantId}?tab=receipts`}>
              <ScanBarcode className="mr-2 h-4 w-4" />
              Receive Stock
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={initialTab}
        onValueChange={(value) => setTab(value as InventoryTab)}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <InventoryOverviewTab detail={detail} />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <InventoryReceiptSessionCard
            productId={detail.productId}
            productName={detail.productName}
            variants={[
              {
                id: detail.variantId,
                name: detail.variantName,
                sku: detail.variantSku,
                trackingMode: detail.trackingMode,
                manageInventory: detail.manageInventory,
                receiptIdentifierTypes: detail.receiptIdentifierTypes,
                onHandQuantity: detail.stats.onHandQuantity,
                availableQuantity: detail.stats.availableQuantity,
              },
            ]}
            initialVariantId={detail.variantId}
            description="Receive stock for this variant using quantity, scanner, camera, or manual entry."
            onReceived={async () => {
              setTab("overview")
              await detailQuery.refetch()
            }}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead className="text-center">
                        Before → After
                      </TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No transactions recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {transaction.type.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                transaction.quantityDelta >= 0
                                  ? "font-medium text-green-600"
                                  : "font-medium text-red-600"
                              }
                            >
                              {transaction.quantityDelta > 0 ? "+" : ""}
                              {transaction.quantityDelta}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {transaction.beforeOnHandQuantity} →{" "}
                            {transaction.afterOnHandQuantity}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.performedByName || "System"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
