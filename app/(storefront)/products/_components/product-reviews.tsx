"use client"

import { useState, useTransition } from "react"

import { formatDistanceToNow } from "date-fns"
import { CheckCircle, Star, ThumbsUp, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { submitReview } from "@/lib/actions/product-reviews"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  helpfulCount: number
  createdAt: Date
  userName: string | null
  isVerifiedPurchase: boolean
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
}

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
  stats: ReviewStats
  canReview: boolean
  reviewMessage?: string
  hasPurchased?: boolean
  isAuthenticated: boolean
}

// ============================================
// Star Rating Component
// ============================================

function StarRating({
  rating,
  size = "sm",
  interactive = false,
  onChange,
}: {
  rating: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onChange?: (rating: number) => void
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={cn(
            "focus:outline-none",
            interactive &&
              "cursor-pointer hover:scale-110 transition-transform",
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300",
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ============================================
// Rating Distribution Bar
// ============================================

function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number
  count: number
  total: number
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-3">{rating}</span>
      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground w-8">{count}</span>
    </div>
  )
}

// ============================================
// Review Card
// ============================================

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {review.userName || "Anonymous"}
              </span>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {review.title && <h4 className="font-medium">{review.title}</h4>}

      {review.content && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.content}
        </p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ThumbsUp className="h-3 w-3" />
          Helpful ({review.helpfulCount})
        </button>
      </div>
    </div>
  )
}

// ============================================
// Review Form
// ============================================

function ReviewForm({
  productId,
  hasPurchased,
  onSuccess,
}: {
  productId: string
  hasPurchased?: boolean
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    startTransition(async () => {
      const result = await submitReview({
        productId,
        rating,
        title: title || undefined,
        content: content || undefined,
      })

      if (result.success) {
        toast.success(result.message)
        setRating(0)
        setTitle("")
        setContent("")
        onSuccess()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Your Rating *</Label>
        <div className="flex items-center gap-2">
          <StarRating
            rating={rating}
            size="lg"
            interactive
            onChange={setRating}
          />
          {rating > 0 && (
            <span className="text-sm text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">Review Title (Optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-content">Your Review (Optional)</Label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell others about your experience with this product..."
          rows={4}
          maxLength={2000}
        />
      </div>

      {!hasPurchased && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          Note: Your review will not be marked as a verified purchase since you
          haven&apos;t ordered this product yet.
        </p>
      )}

      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}

// ============================================
// Main Component
// ============================================

export function ProductReviews({
  productId,
  reviews,
  stats,
  canReview,
  reviewMessage,
  hasPurchased,
  isAuthenticated,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold">Customer Reviews</h2>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Stats Sidebar */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <div className="text-5xl font-bold">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
              <StarRating rating={Math.round(stats.averageRating)} size="md" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {stats.totalReviews}{" "}
              {stats.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                count={stats.ratingDistribution[rating] || 0}
                total={stats.totalReviews}
              />
            ))}
          </div>

          <Separator />

          {/* Write Review Button */}
          {isAuthenticated ? (
            canReview ? (
              <Button
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "outline" : "default"}
                className="w-full"
              >
                {showForm ? "Cancel" : "Write a Review"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center lg:text-left">
                {reviewMessage}
              </p>
            )
          ) : (
            <div className="text-center lg:text-left space-y-2">
              <p className="text-sm text-muted-foreground">
                Sign in to write a review
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="/login">Sign In</a>
              </Button>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {showForm && (
            <>
              <div className="border rounded-lg p-6 bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">
                  Write Your Review
                </h3>
                <ReviewForm
                  productId={productId}
                  hasPurchased={hasPurchased}
                  onSuccess={() => setShowForm(false)}
                />
              </div>
              <Separator />
            </>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div key={review.id}>
                  <ReviewCard review={review} />
                  {index < reviews.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
