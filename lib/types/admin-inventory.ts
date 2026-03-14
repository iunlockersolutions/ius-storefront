export type AdminInventoryTrackingMode = "quantity" | "serial"

export type AdminInventoryStatus = "all" | "low" | "out" | "normal"

export type AdminInventorySortField =
  | "product"
  | "sku"
  | "available"
  | "reserved"
  | "allocated"
  | "onHand"
  | "status"
  | "updated"

export type AdminInventorySortOrder = "asc" | "desc"

export type AdminInventoryTransactionType =
  | "receipt"
  | "adjustment_increase"
  | "adjustment_decrease"
  | "reservation"
  | "reservation_release"
  | "allocation"
  | "allocation_release"
  | "shipment"
  | "return"
  | "damage"
  | "loss"
  | "transfer_out"
  | "transfer_in"

export type AdminInventoryUnitStatus =
  | "received"
  | "available"
  | "reserved"
  | "allocated"
  | "packed"
  | "shipped"
  | "returned"
  | "damaged"
  | "lost"

export type AdminInventoryIdentifierType =
  | "serial"
  | "imei"
  | "imei2"
  | "barcode"

export type AdminInventoryUnitIdentifierFilter =
  | "all"
  | AdminInventoryIdentifierType

export type AdminInventoryUnitSortField =
  | "identifier"
  | "status"
  | "received"
  | "updated"

export interface AdminInventoryStats {
  totalTrackedVariants: number
  quantityTrackedVariants: number
  serialTrackedVariants: number
  lowStockVariants: number
  outOfStockVariants: number
  totalOnHand: number
  totalAvailable: number
  totalReserved: number
  totalAllocated: number
}

export interface AdminInventoryListItem {
  id: string
  variantId: string
  productId: string
  productName: string
  productSlug: string
  variantName: string
  variantSku: string
  trackingMode: AdminInventoryTrackingMode
  manageInventory: boolean
  onHandQuantity: number
  availableQuantity: number
  reservedQuantity: number
  allocatedQuantity: number
  lowStockThreshold: number
  isLowStock: boolean
  isOutOfStock: boolean
  updatedAt: string | Date
}

export interface AdminInventoryLowStockAlert {
  variantId: string
  productName: string
  productSlug: string
  variantName: string
  variantSku: string
  trackingMode: AdminInventoryTrackingMode
  availableQuantity: number
  lowStockThreshold: number
  isOutOfStock: boolean
}

export interface AdminInventoryIdentifier {
  id: string
  type: AdminInventoryIdentifierType
  value: string
}

export interface AdminInventoryUnit {
  id: string
  status: AdminInventoryUnitStatus
  notes: string | null
  receivedAt: string | Date
  updatedAt: string | Date
  primaryIdentifier: AdminInventoryIdentifier | null
  identifiers: AdminInventoryIdentifier[]
}

export interface AdminInventoryTransaction {
  id: string
  type: AdminInventoryTransactionType
  quantityDelta: number
  beforeOnHandQuantity: number
  afterOnHandQuantity: number
  beforeReservedQuantity: number
  afterReservedQuantity: number
  beforeAllocatedQuantity: number
  afterAllocatedQuantity: number
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  createdAt: string | Date
  performedByName: string | null
}

export interface AdminInventoryDetail {
  variantId: string
  productId: string
  productName: string
  productSlug: string
  variantName: string
  variantSku: string
  trackingMode: AdminInventoryTrackingMode
  manageInventory: boolean
  receiptIdentifierTypes: AdminInventoryIdentifierType[]
  stats: {
    onHandQuantity: number
    availableQuantity: number
    reservedQuantity: number
    allocatedQuantity: number
    lowStockThreshold: number
    serializedUnitCount: number
    availableUnitCount: number
  }
  transactions: AdminInventoryTransaction[]
}

export interface AdminInventoryUnitsResponse {
  units: AdminInventoryUnit[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminProductReceiveStockVariant {
  id: string
  name: string
  sku: string
  trackingMode: AdminInventoryTrackingMode
  manageInventory: boolean
  receiptIdentifierTypes: AdminInventoryIdentifierType[]
  onHandQuantity: number | null
  availableQuantity: number | null
}

export interface AdminProductReceiveStockContext {
  productId: string
  productName: string
  productSlug: string
  variants: AdminProductReceiveStockVariant[]
}

export interface AdminInventoryListResponse {
  stats: AdminInventoryStats
  inventory: {
    items: AdminInventoryListItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  lowStockAlerts: AdminInventoryLowStockAlert[]
}

export interface AdminInventoryMovementResponse {
  movements: AdminInventoryTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
