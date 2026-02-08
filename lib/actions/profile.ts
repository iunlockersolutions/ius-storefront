"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { getServerSession, requireAuth } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { customerAddresses, customerProfiles, users } from "@/lib/db/schema"

// ============================================
// Schemas
// ============================================

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  preferredLanguage: z.string().default("en"),
  marketingOptIn: z.boolean().default(false),
})

const addressSchema = z.object({
  type: z.enum(["shipping", "billing", "both"]),
  isDefault: z.boolean().default(false),
  label: z.string().max(50).optional().nullable(),
  recipientName: z.string().min(2, "Recipient name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  addressLine1: z.string().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  instructions: z.string().max(500).optional().nullable(),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// ============================================
// Profile Actions
// ============================================

/**
 * Get current user's full profile with addresses
 */
export async function getFullProfile() {
  const session = await getServerSession()
  if (!session?.user) return null

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      lastPasswordChange: true,
    },
  })

  if (!user) return null

  const profile = await db.query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, session.user.id),
  })

  return {
    ...user,
    profile: profile || null,
  }
}

/**
 * Update profile information
 */
export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await requireAuth()
  const validated = profileSchema.parse(data)

  // Update user name
  await db
    .update(users)
    .set({ name: validated.name, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))

  // Check if profile exists
  const existingProfile = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  const profileData = {
    phone: validated.phone || null,
    dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
    preferredLanguage: validated.preferredLanguage,
    marketingOptIn: validated.marketingOptIn,
    updatedAt: new Date(),
  }

  if (existingProfile.length === 0) {
    await db.insert(customerProfiles).values({
      userId: session.user.id,
      ...profileData,
    })
  } else {
    await db
      .update(customerProfiles)
      .set(profileData)
      .where(eq(customerProfiles.userId, session.user.id))
  }

  revalidatePath("/profile")
  return { success: true }
}

/**
 * Update marketing preferences
 */
export async function updateMarketingPreferences(marketingOptIn: boolean) {
  const session = await requireAuth()

  const existingProfile = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (existingProfile.length === 0) {
    await db.insert(customerProfiles).values({
      userId: session.user.id,
      marketingOptIn,
    })
  } else {
    await db
      .update(customerProfiles)
      .set({ marketingOptIn, updatedAt: new Date() })
      .where(eq(customerProfiles.userId, session.user.id))
  }

  revalidatePath("/profile")
  return { success: true }
}

/**
 * Change password
 */
export async function changePassword(
  data: z.infer<typeof changePasswordSchema>,
) {
  const session = await requireAuth()
  const validated = changePasswordSchema.parse(data)

  try {
    // Use BetterAuth to change password
    const authClient = auth.api
    await authClient.changePassword({
      body: {
        currentPassword: validated.currentPassword,
        newPassword: validated.newPassword,
      },
      headers: await headers(),
    })

    return { success: true }
  } catch {
    return {
      success: false,
      error: "Failed to change password. Please check your current password.",
    }
  }
}

// ============================================
// Address Actions
// ============================================

// Maximum number of addresses allowed per user (configurable)
const MAX_ADDRESSES_PER_USER = 10

/**
 * Get all addresses for current user
 */
export async function getUserAddresses() {
  const session = await getServerSession()
  if (!session?.user) return []

  // Get customer profile ID
  const profile = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (profile.length === 0) return []

  const addresses = await db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, profile[0].id))
    .orderBy(customerAddresses.isDefault)

  return addresses
}

/**
 * Get default addresses for checkout pre-fill
 * Returns both default shipping and billing addresses if they exist
 */
export async function getDefaultAddresses() {
  const session = await getServerSession()
  if (!session?.user) return { shipping: null, billing: null }

  // Get customer profile ID
  const profile = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (profile.length === 0) return { shipping: null, billing: null }

  const addresses = await db
    .select()
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.customerId, profile[0].id),
        eq(customerAddresses.isDefault, true),
      ),
    )

  // Find default shipping address (type "shipping" or "both")
  const defaultShipping =
    addresses.find(
      (a) => (a.type === "shipping" || a.type === "both") && a.isDefault,
    ) || null

  // Find default billing address (type "billing" or "both")
  const defaultBilling =
    addresses.find(
      (a) => (a.type === "billing" || a.type === "both") && a.isDefault,
    ) || null

  return {
    shipping: defaultShipping,
    billing: defaultBilling,
  }
}

/**
 * Get the maximum number of addresses allowed per user
 */
export async function getMaxAddressesPerUser() {
  return MAX_ADDRESSES_PER_USER
}

/**
 * Get a single address by ID
 */
export async function getAddress(addressId: string) {
  const session = await getServerSession()
  if (!session?.user) return null

  // Get customer profile ID
  const profile = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (profile.length === 0) return null

  const [address] = await db
    .select()
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, profile[0].id),
      ),
    )
    .limit(1)

  return address || null
}

/**
 * Create a new address
 */
export async function createAddress(data: z.infer<typeof addressSchema>) {
  const session = await requireAuth()
  const validated = addressSchema.parse(data)

  // Get or create customer profile
  let profile = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (profile.length === 0) {
    const [newProfile] = await db
      .insert(customerProfiles)
      .values({ userId: session.user.id })
      .returning({ id: customerProfiles.id })
    profile = [newProfile]
  }

  // Check if user has reached the maximum number of addresses
  const allAddresses = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, profile[0].id))

  if (allAddresses.length >= MAX_ADDRESSES_PER_USER) {
    return {
      success: false as const,
      error: `Maximum number of addresses (${MAX_ADDRESSES_PER_USER}) reached. Please delete an existing address first.`,
    }
  }

  // If this is set as default, remove default from other addresses of same type
  if (validated.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(
        and(
          eq(customerAddresses.customerId, profile[0].id),
          eq(customerAddresses.type, validated.type),
        ),
      )
  }

  // If this is the first address of this type, make it default
  const existingAddresses = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.customerId, profile[0].id),
        eq(customerAddresses.type, validated.type),
      ),
    )
    .limit(1)

  const isDefault = validated.isDefault || existingAddresses.length === 0

  await db.insert(customerAddresses).values({
    customerId: profile[0].id,
    ...validated,
    isDefault,
  })

  revalidatePath("/profile/addresses")
  return { success: true as const }
}

/**
 * Update an existing address
 */
export async function updateAddress(
  addressId: string,
  data: z.infer<typeof addressSchema>,
) {
  const session = await requireAuth()
  const validated = addressSchema.parse(data)

  // Get customer profile ID
  const profile = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (profile.length === 0) {
    return { success: false, error: "Profile not found" }
  }

  // Verify address belongs to user
  const [existing] = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, profile[0].id),
      ),
    )
    .limit(1)

  if (!existing) {
    return { success: false, error: "Address not found" }
  }

  // If this is set as default, remove default from other addresses of same type
  if (validated.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(
        and(
          eq(customerAddresses.customerId, profile[0].id),
          eq(customerAddresses.type, validated.type),
        ),
      )
  }

  await db
    .update(customerAddresses)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(customerAddresses.id, addressId))

  revalidatePath("/profile/addresses")
  return { success: true as const }
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string) {
  const session = await requireAuth()

  // Get customer profile ID
  const profile = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (profile.length === 0) {
    return { success: false, error: "Profile not found" }
  }

  // Verify address belongs to user and get its details
  const [existing] = await db
    .select()
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, profile[0].id),
      ),
    )
    .limit(1)

  if (!existing) {
    return { success: false, error: "Address not found" }
  }

  await db.delete(customerAddresses).where(eq(customerAddresses.id, addressId))

  // If deleted address was default, set another address of same type as default
  if (existing.isDefault) {
    const [nextAddress] = await db
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.customerId, profile[0].id),
          eq(customerAddresses.type, existing.type),
        ),
      )
      .limit(1)

    if (nextAddress) {
      await db
        .update(customerAddresses)
        .set({ isDefault: true })
        .where(eq(customerAddresses.id, nextAddress.id))
    }
  }

  revalidatePath("/profile/addresses")
  return { success: true }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(addressId: string) {
  const session = await requireAuth()

  // Get customer profile ID
  const profile = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, session.user.id))
    .limit(1)

  if (profile.length === 0) {
    return { success: false, error: "Profile not found" }
  }

  // Verify address belongs to user
  const [existing] = await db
    .select()
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, profile[0].id),
      ),
    )
    .limit(1)

  if (!existing) {
    return { success: false, error: "Address not found" }
  }

  // Remove default from other addresses of same type
  await db
    .update(customerAddresses)
    .set({ isDefault: false })
    .where(
      and(
        eq(customerAddresses.customerId, profile[0].id),
        eq(customerAddresses.type, existing.type),
      ),
    )

  // Set this address as default
  await db
    .update(customerAddresses)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(customerAddresses.id, addressId))

  revalidatePath("/profile/addresses")
  return { success: true }
}
