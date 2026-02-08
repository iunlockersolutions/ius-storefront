"use server"

import { revalidatePath } from "next/cache"

import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { getServerSession, requireAuth } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  productImages,
  products,
  reviewHelpfulVotes,
  reviews,
} from "@/lib/db/schema"

// ============================================
// Get User's Reviews
// ============================================

export async function getUserReviews(page: number = 1, limit: number = 10) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return {
      reviews: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
    }
  }

  const offset = (page - 1) * limit

  const userReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      status: reviews.status,
      helpfulCount: reviews.helpfulCount,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      productId: reviews.productId,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(eq(reviews.userId, session.user.id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset)

  // Get product images
  const productIds = userReviews.map((r) => r.productId)
  const images =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true),
            ),
          )
      : []

  const imageMap = new Map(images.map((i) => [i.productId, i.url]))

  // Get total count
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.userId, session.user.id))

  return {
    reviews: userReviews.map((r) => ({
      ...r,
      productImage: imageMap.get(r.productId) || null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================
// Update Review
// ============================================

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional().nullable(),
  content: z.string().max(2000).optional().nullable(),
})

export async function updateUserReview(
  reviewId: string,
  data: z.infer<typeof updateReviewSchema>,
) {
  const session = await requireAuth()
  const validated = updateReviewSchema.parse(data)

  // Verify review belongs to user and is in pending status
  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, session.user.id)))
    .limit(1)

  if (!existing) {
    return { success: false, error: "Review not found" }
  }

  // Only allow editing pending or approved reviews
  if (existing.status === "rejected") {
    return { success: false, error: "Cannot edit rejected reviews" }
  }

  // Update review - set back to pending for re-moderation
  await db
    .update(reviews)
    .set({
      rating: validated.rating,
      title: validated.title,
      content: validated.content,
      status: "pending", // Re-moderate after edit
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId))

  // Get product for revalidation
  const [product] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, existing.productId))
    .limit(1)

  if (product) {
    revalidatePath(`/products/${product.slug}`)
  }
  revalidatePath("/profile/reviews")

  return {
    success: true,
    message: "Review updated. It will appear after moderation.",
  }
}

// ============================================
// Delete Review
// ============================================

export async function deleteUserReview(reviewId: string) {
  const session = await requireAuth()

  // Verify review belongs to user
  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, session.user.id)))
    .limit(1)

  if (!existing) {
    return { success: false, error: "Review not found" }
  }

  // Delete any helpful votes first
  await db
    .delete(reviewHelpfulVotes)
    .where(eq(reviewHelpfulVotes.reviewId, reviewId))

  // Delete review
  await db.delete(reviews).where(eq(reviews.id, reviewId))

  // Get product for revalidation
  const [product] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, existing.productId))
    .limit(1)

  if (product) {
    revalidatePath(`/products/${product.slug}`)
  }
  revalidatePath("/profile/reviews")

  return { success: true }
}

// ============================================
// Helpful Votes
// ============================================

export async function voteReviewHelpful(reviewId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { success: false, error: "Please sign in to vote" }
  }

  // Check if review exists and is approved
  const [review] = await db
    .select({ id: reviews.id, userId: reviews.userId })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.status, "approved")))
    .limit(1)

  if (!review) {
    return { success: false, error: "Review not found" }
  }

  // Can't vote on own review
  if (review.userId === session.user.id) {
    return { success: false, error: "Cannot vote on your own review" }
  }

  // Check if already voted
  const [existingVote] = await db
    .select()
    .from(reviewHelpfulVotes)
    .where(
      and(
        eq(reviewHelpfulVotes.reviewId, reviewId),
        eq(reviewHelpfulVotes.userId, session.user.id),
      ),
    )
    .limit(1)

  if (existingVote) {
    // Remove vote (toggle)
    await db
      .delete(reviewHelpfulVotes)
      .where(
        and(
          eq(reviewHelpfulVotes.reviewId, reviewId),
          eq(reviewHelpfulVotes.userId, session.user.id),
        ),
      )

    // Decrement helpful count
    await db
      .update(reviews)
      .set({
        helpfulCount: sql`${reviews.helpfulCount} - 1`,
      })
      .where(eq(reviews.id, reviewId))

    return { success: true, voted: false }
  } else {
    // Add vote
    await db.insert(reviewHelpfulVotes).values({
      reviewId,
      userId: session.user.id,
    })

    // Increment helpful count
    await db
      .update(reviews)
      .set({
        helpfulCount: sql`${reviews.helpfulCount} + 1`,
      })
      .where(eq(reviews.id, reviewId))

    return { success: true, voted: true }
  }
}

/**
 * Check if user has voted on a review
 */
export async function hasVotedHelpful(reviewId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) return false

  const [vote] = await db
    .select()
    .from(reviewHelpfulVotes)
    .where(
      and(
        eq(reviewHelpfulVotes.reviewId, reviewId),
        eq(reviewHelpfulVotes.userId, session.user.id),
      ),
    )
    .limit(1)

  return !!vote
}

/**
 * Get user's votes for multiple reviews
 */
export async function getUserVotes(reviewIds: string[]) {
  const session = await getServerSession()
  if (!session?.user?.id || reviewIds.length === 0) return {}

  const votes = await db
    .select({ reviewId: reviewHelpfulVotes.reviewId })
    .from(reviewHelpfulVotes)
    .where(
      and(
        eq(reviewHelpfulVotes.userId, session.user.id),
        sql`${reviewHelpfulVotes.reviewId} = ANY(${reviewIds})`,
      ),
    )

  const votedMap: Record<string, boolean> = {}
  votes.forEach((v) => {
    votedMap[v.reviewId] = true
  })

  return votedMap
}
