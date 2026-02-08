"use server"

import { revalidatePath } from "next/cache"

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"

import { requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { products, reviews, users } from "@/lib/db/schema"

// ============================================
// Get Reviews Stats
// ============================================

export async function getReviewStats() {
  await requireStaff()

  const stats = await db
    .select({
      status: reviews.status,
      count: count(),
    })
    .from(reviews)
    .groupBy(reviews.status)

  const pending = stats.find((s) => s.status === "pending")?.count || 0
  const approved = stats.find((s) => s.status === "approved")?.count || 0
  const rejected = stats.find((s) => s.status === "rejected")?.count || 0

  // Average rating
  const [ratingResult] = await db
    .select({
      avgRating: sql<number>`AVG(${reviews.rating})::numeric(3,2)`,
    })
    .from(reviews)
    .where(eq(reviews.status, "approved"))

  return {
    pending,
    approved,
    rejected,
    total: pending + approved + rejected,
    averageRating: ratingResult?.avgRating || 0,
  }
}

// ============================================
// Get Reviews List
// ============================================

interface ReviewFilterInput {
  page?: number
  limit?: number
  status?: string
  rating?: number
  search?: string
}

export async function getReviews(input: ReviewFilterInput = {}) {
  await requireStaff()

  const { page = 1, limit = 20, status, rating, search } = input
  const offset = (page - 1) * limit

  let query = db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      status: reviews.status,
      orderId: reviews.orderId,
      helpfulCount: reviews.helpfulCount,
      createdAt: reviews.createdAt,
      productId: reviews.productId,
      productName: products.name,
      userId: reviews.userId,
      userEmail: users.email,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .leftJoin(users, eq(reviews.userId, users.id))
    .$dynamic()

  // Build where conditions
  const conditions = []
  if (status) {
    conditions.push(eq(reviews.status, status as any))
  }
  if (rating) {
    conditions.push(eq(reviews.rating, rating))
  }
  if (search) {
    conditions.push(
      or(
        ilike(reviews.title, `%${search}%`),
        ilike(reviews.content, `%${search}%`),
        ilike(products.name, `%${search}%`),
      ),
    )
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions))
  }

  const reviewsList = await query
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count with same filters
  let countQuery = db.select({ count: count() }).from(reviews).$dynamic()
  if (conditions.length > 0) {
    countQuery = countQuery
      .innerJoin(products, eq(reviews.productId, products.id))
      .where(and(...conditions))
  }
  const [totalResult] = await countQuery
  const total = totalResult?.count || 0

  return {
    reviews: reviewsList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================
// Get Pending Reviews
// ============================================

export async function getPendingReviews() {
  await requireStaff()

  const pending = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      status: reviews.status,
      orderId: reviews.orderId,
      createdAt: reviews.createdAt,
      productId: reviews.productId,
      productName: products.name,
      userId: reviews.userId,
      userEmail: users.email,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt))
    .limit(50)

  return pending
}

// ============================================
// Moderate Review
// ============================================

export async function moderateReview(
  reviewId: string,
  action: "approve" | "reject",
  moderationNotes?: string,
) {
  await requireStaff()

  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
  })

  if (!review) {
    return { success: false, error: "Review not found" }
  }

  const newStatus = action === "approve" ? "approved" : "rejected"

  await db
    .update(reviews)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId))

  revalidatePath("/admin/reviews")
  revalidatePath(`/products/${review.productId}`)

  return { success: true }
}

// ============================================
// Bulk Moderate Reviews
// ============================================

export async function bulkModerateReviews(
  reviewIds: string[],
  action: "approve" | "reject",
) {
  await requireStaff()

  const newStatus = action === "approve" ? "approved" : "rejected"

  await db
    .update(reviews)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(sql`${reviews.id} = ANY(${reviewIds})`)

  revalidatePath("/admin/reviews")

  return { success: true, count: reviewIds.length }
}

// ============================================
// Delete Review
// ============================================

export async function deleteReview(reviewId: string) {
  await requireStaff()

  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
  })

  if (!review) {
    return { success: false, error: "Review not found" }
  }

  await db.delete(reviews).where(eq(reviews.id, reviewId))

  revalidatePath("/admin/reviews")
  revalidatePath(`/products/${review.productId}`)

  return { success: true }
}

// ============================================
// Get Review Details
// ============================================

export async function getReviewDetails(reviewId: string) {
  await requireStaff()

  const review = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      status: reviews.status,
      orderId: reviews.orderId,
      helpfulCount: reviews.helpfulCount,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      productId: reviews.productId,
      productName: products.name,
      productSlug: products.slug,
      userId: reviews.userId,
      userEmail: users.email,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.id, reviewId))
    .limit(1)

  return review[0] || null
}
