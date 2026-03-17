"use server"

import { revalidatePath } from "next/cache"

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"

import { requireAdmin, requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  customerAddresses,
  customerProfiles,
  orders,
  user,
} from "@/lib/db/schema"

// ============================================
// Get Customers List
// ============================================

interface CustomerFilterInput {
  page?: number
  limit?: number
  search?: string
}

export async function getCustomers(input: CustomerFilterInput = {}) {
  await requireStaff()

  const { page = 1, limit = 20, search } = input
  const offset = (page - 1) * limit

  // Build query
  let whereClause = undefined
  if (search) {
    whereClause = or(
      ilike(user.name, `%${search}%`),
      ilike(user.email, `%${search}%`),
    )
  }

  // Get customers with order counts
  const customers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      orderCount: sql<number>`(
                SELECT COUNT(*) FROM orders WHERE orders.user_id = "user"."id"
            )`.as("order_count"),
      totalSpent: sql<number>`(
                SELECT COALESCE(SUM(total::numeric), 0) FROM orders 
                WHERE orders.user_id = "user"."id" AND orders.status NOT IN ('cancelled', 'refunded')
            )`.as("total_spent"),
    })
    .from(user)
    .where(
      whereClause
        ? and(eq(user.role, "customer"), whereClause)
        : eq(user.role, "customer"),
    )
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(user)
    .where(
      whereClause
        ? and(eq(user.role, "customer"), whereClause)
        : eq(user.role, "customer"),
    )
  const total = totalResult?.count || 0

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================
// Get Customer Detail
// ============================================

export async function getCustomer(customerId: string) {
  await requireStaff()

  // Get user info
  const [userData] = await db.select().from(user).where(eq(user.id, customerId))

  if (!userData || userData.role !== "customer") {
    return null
  }

  // Get profile
  const profile = await db.query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, customerId),
  })

  // Get addresses
  let addresses: (typeof customerAddresses.$inferSelect)[] = []
  if (profile) {
    addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, profile.id))
      .orderBy(desc(customerAddresses.isDefault))
  }

  // Get order stats
  const [orderStats] = await db
    .select({
      totalOrders: count(),
      totalSpent: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.userId, customerId),
        sql`${orders.status} NOT IN ('cancelled', 'refunded')`,
      ),
    )

  return {
    user: userData,
    profile: profile || null,
    addresses,
    stats: {
      totalOrders: orderStats?.totalOrders || 0,
      totalSpent: orderStats?.totalSpent || 0,
    },
  }
}

// ============================================
// Get Customer Orders
// ============================================

export async function getCustomerOrders(
  customerId: string,
  page = 1,
  limit = 10,
) {
  await requireStaff()

  const offset = (page - 1) * limit

  const customerOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)

  const [totalResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.userId, customerId))

  return {
    orders: customerOrders,
    pagination: {
      page,
      limit,
      total: totalResult?.count || 0,
      totalPages: Math.ceil((totalResult?.count || 0) / limit),
    },
  }
}
