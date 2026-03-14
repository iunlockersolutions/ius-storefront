export const queryKeys = {
  admin: {
    inventoryRoot: () => ["admin", "inventory"] as const,
    brands: () => ["admin", "brands"] as const,
    brand: (id: string) => ["admin", "brands", id] as const,
    products: (params?: {
      page?: number
      limit?: number
      search?: string
      status?: string
      categoryId?: string
    }) => ["admin", "products", params ?? {}] as const,
    product: (id: string) => ["admin", "products", id] as const,
    orders: (params?: {
      page?: number
      limit?: number
      search?: string
      status?:
        | "draft"
        | "pending_payment"
        | "paid"
        | "processing"
        | "packing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
    }) => ["admin", "orders", params ?? {}] as const,
    order: (id: string) => ["admin", "orders", id] as const,
    payments: (params?: {
      page?: number
      limit?: number
      search?: string
      status?: string
      method?: string
    }) => ["admin", "payments", params ?? {}] as const,
    paymentStats: () => ["admin", "payments", "stats"] as const,
    pendingBankTransfers: () =>
      ["admin", "payments", "pending-bank-transfers"] as const,
    reviews: (params?: {
      page?: number
      limit?: number
      search?: string
      status?: string
      rating?: number
    }) => ["admin", "reviews", params ?? {}] as const,
    reviewStats: () => ["admin", "reviews", "stats"] as const,
    pendingReviews: () => ["admin", "reviews", "pending"] as const,
    inventory: (params?: {
      page?: number
      limit?: number
      search?: string
      status?: "all" | "low" | "out" | "normal"
    }) => ["admin", "inventory", "list", params ?? {}] as const,
    inventoryDetail: (id: string) =>
      ["admin", "inventory", "detail", id] as const,
    inventoryUnits: (
      id: string,
      params?: {
        page?: number
        limit?: number
        search?: string
        status?: string
        identifierType?: string
        sortBy?: string
        sortOrder?: string
      },
    ) => ["admin", "inventory", "units", id, params ?? {}] as const,
    productReceiveStock: (productId: string) =>
      ["admin", "inventory", "product-receive-stock", productId] as const,
    inventoryMovements: (
      id: string,
      params?: { page?: number; limit?: number },
    ) => ["admin", "inventory", "movements", id, params ?? {}] as const,
    categories: () => ["admin", "categories"] as const,
    category: (id: string) => ["admin", "categories", id] as const,
    models: () => ["admin", "models"] as const,
    model: (id: string) => ["admin", "models", id] as const,
    customers: (params?: { page?: number; limit?: number; search?: string }) =>
      ["admin", "customers", params ?? {}] as const,
    customer: (id: string) => ["admin", "customers", id] as const,
    customerOrders: (id: string, params?: { page?: number; limit?: number }) =>
      ["admin", "customers", id, "orders", params ?? {}] as const,
    reports: (params?: { days?: number; topProductsLimit?: number }) =>
      ["admin", "reports", params ?? {}] as const,
    settings: () => ["admin", "settings"] as const,
    profile: () => ["admin", "profile"] as const,
    profileSessions: () => ["admin", "profile", "sessions"] as const,
    staffUsers: (params?: {
      page?: number
      limit?: number
      search?: string
      role?: "admin" | "manager" | "support"
    }) => ["admin", "staff-users", params ?? {}] as const,
  },
}
