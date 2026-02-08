"use server"

import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { newsletterSubscribers } from "@/lib/db/schema"

const emailSchema = z.string().email("Please enter a valid email address")

/**
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(email: string) {
  try {
    const validated = emailSchema.parse(email.toLowerCase().trim())

    // Check if already subscribed
    const existing = await db
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, validated))
      .limit(1)

    if (existing.length > 0) {
      return {
        success: true,
        message: "You're already subscribed to our newsletter!",
      }
    }

    // Subscribe
    await db.insert(newsletterSubscribers).values({
      email: validated,
    })

    return {
      success: true,
      message: "Thank you for subscribing!",
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Invalid email address",
      }
    }
    return {
      success: false,
      error: "Failed to subscribe. Please try again.",
    }
  }
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(email: string) {
  try {
    const validated = emailSchema.parse(email.toLowerCase().trim())

    await db
      .delete(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, validated))

    return { success: true }
  } catch {
    return { success: false, error: "Failed to unsubscribe" }
  }
}
