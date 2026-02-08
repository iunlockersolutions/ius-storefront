import { headers } from "next/headers"

import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { roles, userRoles } from "@/lib/db/schema"

/**
 * User Role Type
 */
export type UserRole = "customer" | "admin" | "manager" | "support"

/**
 * Resource types for permission checks
 */
export type Resource =
  | "product"
  | "category"
  | "order"
  | "inventory"
  | "payment"
  | "review"
  | "customer"
  | "staff"
  | "settings"
  | "reports"

/**
 * Action types for permission checks
 */
export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "list"
  | "verify"
  | "approve"
  | "reject"
  | "cancel"
  | "refund"
  | "ban"
  | "invite"
  | "adjust"
  | "export"

/**
 * Permission format: resource.action
 */
export type Permission = `${Resource}.${Action}`

/**
 * Permission definitions for each role.
 * Each role has specific capabilities defined here.
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: [
    "cart.read",
    "cart.write",
    "order.read.own",
    "order.create",
    "profile.read.own",
    "profile.write.own",
    "review.create",
    "review.read",
    "favorites.read.own",
    "favorites.write.own",
  ],
  support: [
    // Orders
    "order.read",
    "order.update",
    "order.list",
    // Payments
    "payment.read",
    "payment.list",
    // Reviews
    "review.read",
    "review.approve",
    "review.reject",
    "review.list",
    // Customers
    "customer.read",
    "customer.list",
  ],
  manager: [
    // Products
    "product.create",
    "product.read",
    "product.update",
    "product.delete",
    "product.list",
    // Categories
    "category.create",
    "category.read",
    "category.update",
    "category.delete",
    "category.list",
    // Orders
    "order.read",
    "order.update",
    "order.list",
    "order.cancel",
    "order.refund",
    // Inventory
    "inventory.read",
    "inventory.update",
    "inventory.adjust",
    "inventory.list",
    // Payments
    "payment.read",
    "payment.verify",
    "payment.refund",
    "payment.list",
    // Reviews
    "review.read",
    "review.approve",
    "review.reject",
    "review.delete",
    "review.list",
    // Customers
    "customer.read",
    "customer.update",
    "customer.list",
    // Reports
    "reports.read",
  ],
  admin: [
    // Admin has all permissions
    "*",
  ],
}

/**
 * Get roles for a user by their ID.
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const result = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))

  return result.map((r) => r.roleName as UserRole)
}

/**
 * Check if a user has a specific role.
 */
export async function hasRole(
  userId: string,
  role: UserRole,
): Promise<boolean> {
  const userRolesList = await getUserRoles(userId)
  return userRolesList.includes(role)
}

/**
 * Check if a user has any of the specified roles.
 */
export async function hasAnyRole(
  userId: string,
  roleList: UserRole[],
): Promise<boolean> {
  const userRolesList = await getUserRoles(userId)
  return roleList.some((role) => userRolesList.includes(role))
}

/**
 * Check if a user has a specific permission.
 */
export async function hasPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  const userRolesList = await getUserRoles(userId)

  for (const role of userRolesList) {
    const permissions = ROLE_PERMISSIONS[role]
    if (permissions.includes("*") || permissions.includes(permission)) {
      return true
    }
  }

  return false
}

/**
 * Check if a user has permission for a specific resource and action.
 * This is an alias for hasPermission with a more type-safe signature.
 */
export async function hasResourcePermission(
  userId: string,
  resource: Resource,
  action: Action,
): Promise<boolean> {
  return hasPermission(userId, `${resource}.${action}`)
}

/**
 * Check if a user is an admin.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin")
}

/**
 * Check if a user is staff (admin, manager, or support).
 */
export async function isStaff(userId: string): Promise<boolean> {
  return hasAnyRole(userId, ["admin", "manager", "support"])
}

/**
 * Get the current session from the request.
 * Use this in server actions and API routes.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await getServerSession()

  if (!session?.user) {
    throw new Error("Authentication required")
  }

  return session
}

/**
 * Require specific role(s). Throws if user doesn't have required role.
 */
export async function requireRole(requiredRoles: UserRole | UserRole[]) {
  const session = await requireAuth()

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  const hasRequiredRole = await hasAnyRole(session.user.id, roles)

  if (!hasRequiredRole) {
    throw new Error("Insufficient permissions")
  }

  return session
}

/**
 * Require specific permission. Throws if user doesn't have permission.
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth()
  const permitted = await hasPermission(session.user.id, permission)

  if (!permitted) {
    throw new Error("Insufficient permissions")
  }

  return session
}

/**
 * Require permission for a specific resource and action.
 * Type-safe version of requirePermission.
 */
export async function requireResourcePermission(
  resource: Resource,
  action: Action,
) {
  return requirePermission(`${resource}.${action}`)
}

/**
 * Require admin role. Throws if user is not admin.
 */
export async function requireAdmin() {
  return requireRole("admin")
}

/**
 * Require staff role (admin, manager, or support).
 */
export async function requireStaff() {
  return requireRole(["admin", "manager", "support"])
}
