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

export interface AdminOrderItem {
  id: string
  variantId: string | null
  quantity: number
  unitPrice: string
  subtotal: string
  productName: string
  variantName: string
  sku: string
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

export interface AdminOrder {
  id: string
  orderNumber: string
  status: AdminOrderStatus
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
  createdAt: string | Date
  updatedAt: string | Date
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
  items: AdminOrderItem[]
  statusHistory: AdminOrderStatusHistoryEntry[]
  shipments: AdminOrderShipment[]
  packing: AdminOrderPackingSummary
}
