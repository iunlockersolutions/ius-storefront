import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ChevronLeft, MessageSquare, Star, ThumbsUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getUserReviews } from "@/lib/actions/customer-reviews"
import { getServerSession } from "@/lib/auth/rbac"

import { ReviewActions } from "./review-actions"

export const metadata = {
  title: "My Reviews",
  description: "View and manage your product reviews",
}

interface ReviewsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/sign-in?callbackUrl=/profile/reviews")
  }

  const params = await searchParams
  const page = parseInt(params.page || "1", 10)

  const { reviews, pagination } = await getUserReviews(page, 10)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Profile
        </Link>
        <div>
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your product reviews ({pagination.total} total)
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-medium">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start sharing your thoughts on products you&apos;ve purchased
            </p>
            <Link
              href="/orders"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              View your orders to leave reviews
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={`/profile/reviews?page=${pageNum}`}
                  className={`px-4 py-2 rounded-md text-sm ${
                    pageNum === page
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {pageNum}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title: string | null
    content: string | null
    status: "pending" | "approved" | "rejected"
    helpfulCount: number
    createdAt: Date
    updatedAt: Date
    productId: string
    productName: string
    productSlug: string
    productImage: string | null
  }
}

function ReviewCard({ review }: ReviewCardProps) {
  const statusColors = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Product Image */}
          <Link href={`/products/${review.productSlug}`} className="shrink-0">
            <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
              {review.productImage ? (
                <Image
                  src={review.productImage}
                  alt={review.productName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </Link>

          {/* Review Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/products/${review.productSlug}`}
                  className="font-medium hover:underline line-clamp-1"
                >
                  {review.productName}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${statusColors[review.status]}`}
                  >
                    {review.status}
                  </Badge>
                </div>
              </div>
              <ReviewActions review={review} />
            </div>

            {review.title && <p className="font-medium mt-2">{review.title}</p>}
            {review.content && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                {review.content}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {review.helpfulCount > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {review.helpfulCount} found helpful
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
