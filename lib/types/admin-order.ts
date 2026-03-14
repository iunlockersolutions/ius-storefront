export type AdminOrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "processing"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export type AdminOrderPaymentStatus =
  | "unpaid"
  | "pending_verification"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled"

export type AdminOrderFulfillmentStatus =
  | "confirmed"
  | "processing"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled"

export type AdminOrderListView =
  | "all"
  | "needs_payment_review"
  | "awaiting_processing"
  | "needs_serial_assignment"
  | "ready_to_ship"
  | "delivered"
  | "exceptions"

export interface AdminOrderAddress {
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  instructions?: string
}

export interface AdminOrderStatusHistoryEntry {
  id: string
  fromStatus: string | null
  toStatus: string
  notes: string | null
  createdAt: string | Date
  changedBy: {
    id: string | null
    name: string | null
    email: string | null
  } | null
}

export interface AdminOrderItemAllocation {
  id: string
  quantity: number
  allocatedAt: string | Date
  releasedAt: string | Date | null
}

export interface AdminOrderUnitAssignment {
  id: string
  inventoryUnitId: string
  assignedAt: string | Date
  unassignedAt: string | Date | null
  unitStatus: string
  identifiers: Array<{
    id: string
    type: "serial" | "imei" | "imei2" | "barcode"
    value: string
  }>
}

export interface AdminOrderPaymentProof {
  id: string
  fileUrl: string
  fileName: string
  notes: string | null
  verifiedAt: string | Date | null
  verificationNotes: string | null
  isApproved: string | Date | null
  createdAt: string | Date
}

export interface AdminOrderPayment {
  id: string
  method: "card" | "bank_transfer" | "cash_on_delivery"
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "cancelled"
  amount: string
  currency: string
  externalId: string | null
  externalStatus: string | null
  failureReason: string | null
  processedAt: string | Date | null
  createdAt: string | Date
  proofs: AdminOrderPaymentProof[]
}

export interface AdminOrderLineProgress {
  committedQuantity: number
  preparingQuantity: number
  readyToShipQuantity: number
  remainingToAssign: number
  remainingToShip: number
  isReadyToShip: boolean
  blockedReason: string | null
}

export interface AdminOrderItem {
  id: string
  variantId: string | null
  quantity: number
  unitPrice: string
  subtotal: string
  productName: string
  variantName: string
  sku: string
  snapshot: {
    productId: string
    variantId: string | null
    productName: string
    productSlug: string
    variantName: string
    sku: string
    manageInventory: boolean
    trackingMode: "quantity" | "serial" | null
    receiptIdentifierTypes: Array<"serial" | "imei" | "imei2" | "barcode">
    unitPrice: string
    currency: "LKR"
  }
  variant: {
    id: string | null
    name: string | null
    sku: string | null
    trackingMode: "quantity" | "serial" | null
    manageInventory: boolean
  } | null
  packing: {
    trackingMode: "quantity" | "serial" | null
    manageInventory: boolean
    allocatedQuantity: number
    assignedUnitCount: number
    pendingSerializedCount: number
    allocations: AdminOrderItemAllocation[]
    assignments: AdminOrderUnitAssignment[]
  }
  progress: AdminOrderLineProgress
}

export interface AdminOrderShipment {
  id: string
  carrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  shippedAt: string | Date | null
  deliveredAt: string | Date | null
  notes: string | null
  createdAt: string | Date
}

export interface AdminOrderPackingSummary {
  canStart: boolean
  canComplete: boolean
  isStarted: boolean
  totalSerializedUnitsRequired: number
  totalSerializedUnitsAssigned: number
  serializedLinesRemaining: number
  quantityLinesRequiringAllocation: number
  quantityLinesAllocated: number
  issues: string[]
}

export interface AdminOrderListItem {
  id: string
  orderNumber: string
  status: AdminOrderStatus
  paymentStatus: AdminOrderPaymentStatus
  fulfillmentStatus: AdminOrderFulfillmentStatus
  paymentMethod: "card" | "bank_transfer" | "cash_on_delivery" | null
  shippingMethod: string
  total: string
  createdAt: string | Date
  updatedAt: string | Date
  latestActivityAt: string | Date
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
  customerEmail: string
  customerName: string | null
  customerPhone: string | null
  isGuest: boolean
  itemCount: number
  totalQuantity: number
  latestTrackingNumber: string | null
  latestCarrier: string | null
  progress: {
    totalLines: number
    readyLines: number
    serialLines: number
    serialAssignedUnits: number
    serialRequiredUnits: number
    quantityLines: number
    allocatedQuantityUnits: number
    committedQuantityUnits: number
    canShipNow: boolean
    attentionState:
      | "needs_payment_review"
      | "awaiting_processing"
      | "needs_serial_assignment"
      | "ready_to_ship"
      | "exception"
      | null
  }
}

export interface AdminOrder {
  id: string
  orderNumber: string
  status: AdminOrderStatus
  paymentStatus: AdminOrderPaymentStatus
  fulfillmentStatus: AdminOrderFulfillmentStatus
  paymentMethod: "card" | "bank_transfer" | "cash_on_delivery" | null
  shippingMethod: string
  subtotal: string
  taxAmount: string
  shippingCost: string
  discountAmount: string
  total: string
  notes: string | null
  adminNotes: string | null
  customerEmail: string
  customerPhone: string | null
  customerName: string | null
  shippingAddress: AdminOrderAddress | null
  billingAddress: AdminOrderAddress | null
  placedAt: string | Date
  confirmedAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
  payments: AdminOrderPayment[]
  items: AdminOrderItem[]
  statusHistory: AdminOrderStatusHistoryEntry[]
  shipments: AdminOrderShipment[]
  packing: AdminOrderPackingSummary
}
