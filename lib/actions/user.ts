"use server"

import { revalidatePath } from "next/cache"

import { eq } from "drizzle-orm"
import { z } from "zod"

import { getServerSession, requireAuth } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { customerProfiles, users } from "@/lib/db/schema"

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
