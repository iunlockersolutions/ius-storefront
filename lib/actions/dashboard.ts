"use server"

import { and, count, eq, gte, sql } from "drizzle-orm"

import { requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { orders, products, roles, userRoles, users } from "@/lib/db/schema"

export async function getDashboardStats() {
  try {
    await requireStaff()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get total counts
    const [totalOrders] = await db.select({ count: count() }).from(orders)
    const [totalProducts] = await db.select({ count: count() }).from(products)

    // Get customer count (users with customer role)
    const customerRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, "customer"))
      .limit(1)

    let totalCustomers = { count: 0 }
    if (customerRole.length > 0) {
      ;[totalCustomers] = await db
        .select({ count: count() })
        .from(userRoles)
        .where(eq(userRoles.roleId, customerRole[0].id))
    }

    // Get revenue stats
    const [totalRevenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.status, "delivered")))

    const [monthlyRevenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(eq(orders.status, "delivered"), gte(orders.createdAt, thisMonth)),
      )

    const [todayOrders] = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, today))

    // Get pending orders count
    const [pendingOrders] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending_payment"))

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        customer: {
          name: users.name,
          email: users.email,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(5)

    return {
      success: true as const,
      data: {
        totals: {
          orders: totalOrders.count,
          products: totalProducts.count,
          customers: totalCustomers.count,
          revenue: totalRevenue.total || 0,
        },
        today: {
          orders: todayOrders.count,
        },
        monthly: {
          revenue: monthlyRevenue.total || 0,
        },
        pending: {
          orders: pendingOrders.count,
        },
        recentOrders,
      },
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return { success: false as const, error: "Failed to fetch dashboard stats" }
  }
}
