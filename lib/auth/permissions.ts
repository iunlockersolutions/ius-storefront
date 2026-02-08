import { createAccessControl } from "better-auth/plugins/access"
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access"

/**
 * Permission Statements
 *
 * Defines all resources and their available actions in the system.
 * Each resource maps to a set of actions that can be performed.
 */
export const statement = {
  // Include default BetterAuth statements (user, session management)
  ...defaultStatements,

  // Product management
  product: ["create", "read", "update", "delete", "list"],

  // Category management
  category: ["create", "read", "update", "delete", "list"],

  // Order management
  order: ["read", "update", "list", "cancel", "refund"],

  // Inventory management
  inventory: ["read", "update", "adjust", "list"],

  // Payment management
  payment: ["read", "verify", "refund", "list"],

  // Review moderation
  review: ["read", "approve", "reject", "delete", "list"],

  // Customer management
  customer: ["read", "update", "ban", "list"],

  // Staff management (creating/managing other staff users)
  staff: ["create", "read", "update", "delete", "list", "invite"],

  // Settings management
  settings: ["read", "update"],

  // Reports access
  reports: ["read", "export"],
} as const

/**
 * Access Control Instance
 */
export const ac = createAccessControl(statement)

/**
 * Role Definitions
 *
 * Each role has specific permissions mapped to resources.
 * Roles follow the principle of least privilege.
 */

/**
 * Customer Role
 * - Can view their own data only
 * - No admin panel access
 */
export const customer = ac.newRole({
  // Customers have no admin permissions
})

/**
 * Support Role
 * - Can view orders and assist customers
 * - Can moderate reviews
 * - Cannot modify products or settings
 */
export const support = ac.newRole({
  // Inherit base user management (view only)
  ...adminAc.statements,

  // Order viewing and status updates
  order: ["read", "update", "list"],

  // Review moderation
  review: ["read", "approve", "reject", "list"],

  // Customer viewing
  customer: ["read", "list"],

  // Basic payment viewing
  payment: ["read", "list"],
})

/**
 * Manager Role
 * - Full product and inventory management
 * - Order management
 * - Cannot manage staff or settings
 */
export const manager = ac.newRole({
  // Inherit base user management
  ...adminAc.statements,

  // Full product management
  product: ["create", "read", "update", "delete", "list"],

  // Full category management
  category: ["create", "read", "update", "delete", "list"],

  // Full order management
  order: ["read", "update", "list", "cancel", "refund"],

  // Full inventory management
  inventory: ["read", "update", "adjust", "list"],

  // Payment management
  payment: ["read", "verify", "refund", "list"],

  // Review moderation
  review: ["read", "approve", "reject", "delete", "list"],

  // Customer management
  customer: ["read", "update", "list"],

  // Reports viewing
  reports: ["read"],
})

/**
 * Admin Role
 * - Full system access
 * - Can manage all resources including staff and settings
 */
export const admin = ac.newRole({
  // Full user management from BetterAuth
  ...adminAc.statements,

  // Full product management
  product: ["create", "read", "update", "delete", "list"],

  // Full category management
  category: ["create", "read", "update", "delete", "list"],

  // Full order management
  order: ["read", "update", "list", "cancel", "refund"],

  // Full inventory management
  inventory: ["read", "update", "adjust", "list"],

  // Full payment management
  payment: ["read", "verify", "refund", "list"],

  // Full review management
  review: ["read", "approve", "reject", "delete", "list"],

  // Full customer management
  customer: ["read", "update", "ban", "list"],

  // Staff management
  staff: ["create", "read", "update", "delete", "list", "invite"],

  // Settings management
  settings: ["read", "update"],

  // Full reports access
  reports: ["read", "export"],
})

/**
 * Role Configuration Export
 *
 * This object maps role names to their permission definitions.
 * Used by both server and client BetterAuth configurations.
 */
export const roles = {
  customer,
  support,
  manager,
  admin,
}

/**
 * Type exports for TypeScript support
 */
export type Role = keyof typeof roles
export type Statement = typeof statement
