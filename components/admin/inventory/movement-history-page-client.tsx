"use client"

import { MovementHistory } from "@/components/admin/inventory/movement-history"
import {
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { useInventoryMovementsQuery } from "@/hooks/admin/use-inventory-movements-query"

interface MovementHistoryPageClientProps {
  variantId: string
  page: number
}

export function MovementHistoryPageClient({
  variantId,
  page,
}: MovementHistoryPageClientProps) {
  const movementsQuery = useInventoryMovementsQuery({
    variantId,
    page,
    limit: 20,
  })

  if (movementsQuery.isLoading || movementsQuery.isFetching) {
    return <AdminQueryLoadingState skeletonClassName="h-64 w-full" />
  }

  if (movementsQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(
          movementsQuery.error,
          "Failed to load movement history",
        )}
        onRetry={movementsQuery.refetch}
      />
    )
  }

  return (
    <MovementHistory
      movements={movementsQuery.data?.movements ?? []}
      pagination={
        movementsQuery.data?.pagination ?? {
          page,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      }
    />
  )
}
