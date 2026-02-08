"use server"

import { revalidatePath } from "next/cache"

import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { getServerSession, requireAdmin, requireAuth } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { customerProfiles, roles, userRoles, users } from "@/lib/db/schema"

// Schema for customer profile updates
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  marketingOptIn: z.boolean().optional(),
})

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile() {
  const session = await getServerSession()
  if (!session?.user) return null

  const profile = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  return profile[0] || null
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(
  data: z.infer<typeof updateProfileSchema>,
) {
  const session = await requireAuth()
  const validated = updateProfileSchema.parse(data)

  // Update user name if provided
  if (validated.name) {
    await db
      .update(users)
      .set({ name: validated.name, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))
  }

  // Check if profile exists
  const existingProfile = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (existingProfile.length === 0) {
    // Create profile
    await db.insert(customerProfiles).values({
      userId: session.user.id,
      phone: validated.phone,
      marketingOptIn: validated.marketingOptIn ?? false,
    })
  } else {
    // Update profile
    await db
      .update(customerProfiles)
      .set({
        phone: validated.phone,
        marketingOptIn: validated.marketingOptIn,
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.userId, session.user.id))
  }

  revalidatePath("/profile")
  return { success: true }
}

/**
 * Assign a role to a user (Admin only)
 */
export async function assignUserRole(userId: string, roleName: string) {
  const session = await requireAdmin()

  // Get the role
  const [role] = await db
    .select()
    .from(roles)
    .where(
      eq(roles.name, roleName as "customer" | "admin" | "manager" | "support"),
    )
    .limit(1)

  if (!role) {
    throw new Error("Role not found")
  }

  // Check if user already has this role
  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
    .limit(1)

  if (existing.length > 0) {
    return { success: true, message: "Role already assigned" }
  }

  // Assign role
  await db.insert(userRoles).values({
    userId,
    roleId: role.id,
    assignedBy: session.user.id,
  })

  revalidatePath("/admin/customers")
  return { success: true }
}

/**
 * Remove a role from a user (Admin only)
 */
export async function removeUserRole(userId: string, roleName: string) {
  await requireAdmin()

  // Get the role
  const [role] = await db
    .select()
    .from(roles)
    .where(
      eq(roles.name, roleName as "customer" | "admin" | "manager" | "support"),
    )
    .limit(1)

  if (!role) {
    throw new Error("Role not found")
  }

  // Remove role
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))

  revalidatePath("/admin/customers")
  return { success: true }
}
