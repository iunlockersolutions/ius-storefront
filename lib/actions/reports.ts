"use server"

import { and, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm"

import { requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  orderItems,
  orders,
  payments,
  products,
  productVariants,
  reviews,
  users,
} from "@/lib/db/schema"

// ============================================
// Sales Overview
// ============================================

interface DateRange {
  startDate: Date
  endDate: Date
}

export async function getSalesOverview(dateRange?: DateRange) {
  await requireStaff()

  const conditions = []
  if (dateRange) {
    conditions.push(gte(orders.createdAt, dateRange.startDate))
    conditions.push(lte(orders.createdAt, dateRange.endDate))
  }

  // Total sales (completed orders)
  const salesConditions = [...conditions, eq(orders.status, "paid")]
  const [salesResult] = await db
    .select({
      totalOrders: count(),
      totalRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
      avgOrderValue: sql<string>`COALESCE(AVG(${orders.total}::numeric), 0)::text`,
    })
    .from(orders)
    .where(and(...salesConditions))

  // Pending orders
  const [pendingResult] = await db
    .select({
      count: count(),
      total: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
    })
    .from(orders)
    .where(
      and(
        ...conditions,
        sql`${orders.status} IN ('pending_payment', 'processing', 'shipped')`,
      ),
    )

  // Today's stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [todayResult] = await db
    .select({
      orders: count(),
      revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, today), eq(orders.status, "paid")))

  return {
    totalOrders: salesResult?.totalOrders || 0,
    totalRevenue: parseFloat(salesResult?.totalRevenue || "0"),
    avgOrderValue: parseFloat(salesResult?.avgOrderValue || "0"),
    pendingOrders: pendingResult?.count || 0,
    pendingRevenue: parseFloat(pendingResult?.total || "0"),
    todayOrders: todayResult?.orders || 0,
    todayRevenue: parseFloat(todayResult?.revenue || "0"),
  }
}

// ============================================
// Sales by Day (for charts)
// ============================================

export async function getSalesByDay(days: number = 30) {
  await requireStaff()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const result = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})::text`,
      orders: count(),
      revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), eq(orders.status, "paid")))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`)

  return result.map((r) => ({
    date: r.date,
    orders: r.orders,
    revenue: parseFloat(r.revenue),
  }))
}

// ============================================
// Top Products
// ============================================

export async function getTopProducts(limit: number = 10) {
  await requireStaff()

  const result = await db
    .select({
      productId: productVariants.productId,
      productName: products.name,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
      totalRevenue: sql<string>`SUM(${orderItems.subtotal}::numeric)::text`,
      orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})::int`,
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.status, "paid"), isNotNull(orderItems.variantId)))
    .groupBy(productVariants.productId, products.name)
    .orderBy(desc(sql`SUM(${orderItems.subtotal}::numeric)`))
    .limit(limit)

  return result.map((r) => ({
    ...r,
    totalRevenue: parseFloat(r.totalRevenue),
  }))
}

// ============================================
// Payment Methods Distribution
// ============================================

export async function getPaymentMethodStats() {
  await requireStaff()

  const result = await db
    .select({
      method: payments.method,
      count: count(),
      total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)::text`,
    })
    .from(payments)
    .where(eq(payments.status, "completed"))
    .groupBy(payments.method)

  return result.map((r) => ({
    method: r.method,
    count: r.count,
    total: parseFloat(r.total),
  }))
}

// ============================================
// Customer Stats
// ============================================

export async function getCustomerStats() {
  await requireStaff()

  // Total customers
  const [totalResult] = await db.select({ count: count() }).from(users)

  // New customers this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const [newResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, startOfMonth))

  // Customers with orders
  const [withOrdersResult] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${orders.userId})::int` })
    .from(orders)
    .where(eq(orders.status, "paid"))

  // Top customers
  const topCustomers = await db
    .select({
      userId: orders.userId,
      email: users.email,
      name: users.name,
      orderCount: count(),
      totalSpent: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)::text`,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.status, "paid"))
    .groupBy(orders.userId, users.email, users.name)
    .orderBy(desc(sql`SUM(${orders.total}::numeric)`))
    .limit(10)

  return {
    totalCustomers: totalResult?.count || 0,
    newCustomersThisMonth: newResult?.count || 0,
    customersWithOrders: withOrdersResult?.count || 0,
    topCustomers: topCustomers.map((c) => ({
      ...c,
      totalSpent: parseFloat(c.totalSpent),
    })),
  }
}

// ============================================
// Order Status Distribution
// ============================================

export async function getOrderStatusDistribution() {
  await requireStaff()

  const result = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .groupBy(orders.status)

  return result
}

// ============================================
// Recent Activity
// ============================================

export async function getRecentActivity(limit: number = 20) {
  await requireStaff()

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      customerEmail: orders.customerEmail,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)

  const recentReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      status: reviews.status,
      productId: reviews.productId,
      productName: products.name,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt))
    .limit(10)

  return {
    recentOrders,
    recentReviews,
  }
}

// ============================================
// Revenue by Category (if categories exist)
// ============================================

export async function getRevenueByCategory() {
  await requireStaff()

  // Join through productVariants to get to products and categories
  const result = await db
    .select({
      categoryId: products.categoryId,
      revenue: sql<string>`COALESCE(SUM(${orderItems.subtotal}::numeric), 0)::text`,
      orderCount: count(),
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.status, "paid"), isNotNull(orderItems.variantId)))
    .groupBy(products.categoryId)

  return result.map((r) => ({
    categoryId: r.categoryId,
    revenue: parseFloat(r.revenue),
    orderCount: r.orderCount,
  }))
}
