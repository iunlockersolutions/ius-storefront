export const queryKeys = {
  admin: {
    products: (params?: {
      page?: number
      limit?: number
      search?: string
      status?: string
      categoryId?: string
    }) => ["admin", "products", params ?? {}] as const,
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
    }) => ["admin", "inventory", params ?? {}] as const,
    categories: () => ["admin", "categories"] as const,
    category: (id: string) => ["admin", "categories", id] as const,
    customers: (params?: { page?: number; limit?: number; search?: string }) =>
      ["admin", "customers", params ?? {}] as const,
    customer: (id: string) => ["admin", "customers", id] as const,
    customerOrders: (id: string, params?: { page?: number; limit?: number }) =>
      ["admin", "customers", id, "orders", params ?? {}] as const,
    customerRoles: () => ["admin", "customers", "roles"] as const,
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
