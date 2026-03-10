import { headers } from "next/headers"

import type { Role as BetterAuthRole } from "better-auth/plugins/access"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { roles as accessRoles } from "@/lib/auth/permissions"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"

/**
 * User Role Type
 */
export type UserRole = "customer" | "admin" | "manager" | "support"

/**
 * Resource types for permission checks
 */
export type Resource =
  | "brand"
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

const VALID_ROLES = ["customer", "admin", "manager", "support"] as const
const STAFF_ROLES = new Set<UserRole>(["admin", "manager", "support"])
const adminAccessRoles = accessRoles as Record<UserRole, BetterAuthRole>

function isValidUserRole(value: string): value is UserRole {
  return (VALID_ROLES as readonly string[]).includes(value)
}

export function normalizeUserRoles(roleValue?: string | null): UserRole[] {
  const parsed = (roleValue ?? "customer")
    .split(",")
    .map((role) => role.trim())
    .filter(isValidUserRole)

  return parsed.length > 0 ? parsed : ["customer"]
}

export function getPrimaryUserRole(roleValue?: string | null): UserRole {
  const roles = normalizeUserRoles(roleValue)

  if (roles.includes("admin")) return "admin"
  if (roles.includes("manager")) return "manager"
  if (roles.includes("support")) return "support"
  return "customer"
}

function toPermissionObject(permission: string) {
  const [resource, action] = permission.split(".")

  if (!resource || !action) {
    return null
  }

  return {
    [resource]: [action],
  } as Record<string, string[]>
}

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
    // Brands
    "brand.create",
    "brand.read",
    "brand.update",
    "brand.delete",
    "brand.list",
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
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      role: true,
    },
  })

  return normalizeUserRoles(existingUser?.role)
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
  const permissionObject = toPermissionObject(permission)

  if (!permissionObject) {
    return false
  }

  for (const role of userRolesList) {
    if (adminAccessRoles[role]?.authorize(permissionObject).success) {
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
  const roles = await getUserRoles(userId)
  return roles.some((role) => STAFF_ROLES.has(role))
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
  const sessionRoles = normalizeUserRoles(session.user.role)
  const hasRequiredRole = roles.some((role) => sessionRoles.includes(role))

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
  const permissionObject = toPermissionObject(permission)
  const sessionRoles = normalizeUserRoles(session.user.role)
  const permitted =
    permissionObject !== null &&
    sessionRoles.some(
      (role) => adminAccessRoles[role]?.authorize(permissionObject).success,
    )

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
