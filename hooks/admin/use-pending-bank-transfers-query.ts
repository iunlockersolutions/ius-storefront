"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface BankTransferProof {
  id: string
  fileUrl: string
  fileName: string
  notes: string | null
  createdAt: string | Date
}

export interface PendingTransfer {
  id: string
  orderId: string
  amount: string
  currency: string
  createdAt: string | Date
  orderNumber: string
  customerEmail: string
  customerName: string | null
  proofs: BankTransferProof[]
}

export function usePendingBankTransfersQuery() {
  return useQuery({
    queryKey: queryKeys.admin.pendingBankTransfers(),
    queryFn: async (): Promise<PendingTransfer[]> => {
      const response = await fetch("/api/admin/payments/bank-transfers")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch pending bank transfers"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as PendingTransfer[]
    },
    staleTime: 60_000,
  })
}
