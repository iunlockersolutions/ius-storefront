"use server"

import { revalidatePath } from "next/cache"

import { and, avg, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { getServerSession } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  orderItems,
  orders,
  products,
  productVariants,
  reviews,
  users,
} from "@/lib/db/schema"

// ============================================
// Get Product Reviews
// ============================================

export async function getProductReviews(
  productId: string,
  page: number = 1,
  limit: number = 10,
) {
  const offset = (page - 1) * limit

  const productReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      helpfulCount: reviews.helpfulCount,
      createdAt: reviews.createdAt,
      orderId: reviews.orderId,
      userId: reviews.userId,
      userName: users.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(
      and(eq(reviews.productId, productId), eq(reviews.status, "approved")),
    )
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(
      and(eq(reviews.productId, productId), eq(reviews.status, "approved")),
    )

  return {
    reviews: productReviews.map((r) => ({
      ...r,
      isVerifiedPurchase: !!r.orderId,
    })),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  }
}

// ============================================
// Get Product Review Stats
// ============================================

export async function getProductReviewStats(productId: string) {
  const stats = await db
    .select({
      averageRating: sql<string>`COALESCE(AVG(${reviews.rating}), 0)::text`,
      totalReviews: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(
      and(eq(reviews.productId, productId), eq(reviews.status, "approved")),
    )

  // Get rating distribution
  const distribution = await db
    .select({
      rating: reviews.rating,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(
      and(eq(reviews.productId, productId), eq(reviews.status, "approved")),
    )
    .groupBy(reviews.rating)

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  distribution.forEach((d) => {
    ratingCounts[d.rating] = d.count
  })

  return {
    averageRating: parseFloat(stats[0]?.averageRating || "0"),
    totalReviews: stats[0]?.totalReviews || 0,
    ratingDistribution: ratingCounts,
  }
}

// ============================================
// Check if User Can Review
// ============================================

export async function canUserReview(productId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { canReview: false, reason: "Please sign in to leave a review" }
  }

  // Check if user already reviewed this product
  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, session.user.id),
        eq(reviews.productId, productId),
      ),
    )
    .limit(1)

  if (existingReview) {
    return {
      canReview: false,
      reason: "You have already reviewed this product",
    }
  }

  // Check if user has purchased this product
  const purchasedVariants = await db
    .select({ variantId: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId))

  const variantIds = purchasedVariants.map((v) => v.variantId)

  if (variantIds.length === 0) {
    return { canReview: true, hasPurchased: false }
  }

  // Use sql template to properly construct the array
  const [purchase] = await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.userId, session.user.id),
        eq(orders.status, "delivered"),
        sql`${orderItems.variantId} = ANY(ARRAY[${sql.join(
          variantIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )}])`,
      ),
    )
    .limit(1)

  return {
    canReview: true,
    hasPurchased: !!purchase,
  }
}

// ============================================
// Submit Review
// ============================================

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
})

export async function submitReview(data: z.infer<typeof reviewSchema>) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { success: false, error: "Please sign in to leave a review" }
  }

  const parsed = reviewSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: "Invalid review data" }
  }

  const { productId, rating, title, content } = parsed.data

  // Check if user already reviewed
  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, session.user.id),
        eq(reviews.productId, productId),
      ),
    )
    .limit(1)

  if (existingReview) {
    return { success: false, error: "You have already reviewed this product" }
  }

  // Check if user has purchased this product
  const purchasedVariants = await db
    .select({ variantId: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId))

  const variantIds = purchasedVariants.map((v) => v.variantId)

  let orderId: string | null = null

  if (variantIds.length > 0) {
    const [purchase] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, session.user.id),
          eq(orders.status, "delivered"),
          sql`${orderItems.variantId} = ANY(${variantIds})`,
        ),
      )
      .limit(1)

    orderId = purchase?.id || null
  }

  // Create review (pending moderation)
  await db.insert(reviews).values({
    productId,
    userId: session.user.id,
    orderId,
    rating,
    title: title || null,
    content: content || null,
    status: "pending",
  })

  // Get product for revalidation
  const [product] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (product) {
    revalidatePath(`/products/${product.slug}`)
  }

  return {
    success: true,
    message: "Review submitted successfully. It will appear after moderation.",
  }
}
