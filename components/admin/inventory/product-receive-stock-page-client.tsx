"use client"

import Link from "next/link"

import { ArrowLeft, RefreshCw } from "lucide-react"

import { InventoryReceiptSessionCard } from "@/components/admin/inventory/inventory-receipt-session-card"
import {
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { Button } from "@/components/ui/button"
import { useAdminProductReceiveStockQuery } from "@/services/queries/use-admin-product-receive-stock-query"

interface ProductReceiveStockPageClientProps {
  productId: string
}

export function ProductReceiveStockPageClient({
  productId,
}: ProductReceiveStockPageClientProps) {
  const contextQuery = useAdminProductReceiveStockQuery(productId)

  if (contextQuery.isLoading || contextQuery.isFetching) {
    return <AdminQueryLoadingState skeletonClassName="h-[32rem] w-full" />
  }

  if (contextQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          contextQuery.error,
          "Failed to load stock intake context",
        )}
        onRetry={contextQuery.refetch}
        backHref="/ops/products"
        backLabel="Back to products"
      />
    )
  }

  const context = contextQuery.data

  if (!context || context.variants.length === 0) {
    return (
      <AdminQueryErrorState
        message="This product has no inventory-managed variants available for stock intake"
        backHref={`/ops/products/${productId}/edit`}
        backLabel="Back to product"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" asChild className="w-fit px-0">
            <Link href={`/ops/products/${productId}/edit`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Product
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{context.productName}</h1>
            <p className="text-muted-foreground">
              Receive stock for this product&apos;s managed variants.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => void contextQuery.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <InventoryReceiptSessionCard
        productId={context.productId}
        productName={context.productName}
        variants={context.variants}
        onReceived={async () => {
          await contextQuery.refetch()
        }}
        title="Receive Stock"
        description="Scan or enter stock for the saved product immediately."
      />
    </div>
  )
}
