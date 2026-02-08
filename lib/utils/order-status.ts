/**
 * Order status utilities
 * These are pure functions that can be used in both client and server code
 */

export const ORDER_STATUSES = [
  "draft",
  "pending_payment",
  "paid",
  "processing",
  "packing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  pending_payment: "Pending Payment",
  paid: "Paid",
  processing: "Processing",
  packing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "secondary",
  pending_payment: "warning",
  paid: "success",
  processing: "info",
  packing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "destructive",
  refunded: "outline",
}

// Get valid status transitions for an order
export function getValidTransitions(currentStatus: string): string[] {
  const validTransitions: Record<string, string[]> = {
    draft: ["pending_payment", "cancelled"],
    pending_payment: ["paid", "cancelled"],
    paid: ["processing", "cancelled"],
    processing: ["packing", "cancelled"],
    packing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["refunded"],
    cancelled: [],
    refunded: [],
  }
  return validTransitions[currentStatus] || []
}

export function isValidTransition(from: string, to: string): boolean {
  return getValidTransitions(from).includes(to)
}
