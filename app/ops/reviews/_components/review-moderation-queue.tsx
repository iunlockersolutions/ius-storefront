"use client"

import { useState } from "react"
import Link from "next/link"

import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  User,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  useBulkModerateReviewsMutation,
  useModerateReviewMutation,
} from "@/services/mutations/use-review-mutations"

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  orderId: string | null
  createdAt: string | Date
  productId: string
  productName: string
  userId: string | null
  userEmail: string | null
  userName: string | null
}

interface ReviewModerationQueueProps {
  reviews: Review[]
  isLoading?: boolean
  errorMessage?: string | null
  onRefetch?: () => Promise<unknown>
}

export function ReviewModerationQueue({
  reviews,
  isLoading = false,
  errorMessage = null,
  onRefetch,
}: ReviewModerationQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const moderateMutation = useModerateReviewMutation()
  const bulkModerateMutation = useBulkModerateReviewsMutation()

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)))
    }
  }

  const handleModerate = async (
    reviewId: string,
    action: "approve" | "reject",
  ) => {
    setActiveReviewId(reviewId)
    try {
      await moderateMutation.mutateAsync({ reviewId, action })
      if (onRefetch) {
        await onRefetch()
      }
    } catch (error) {
      console.error("Moderation error:", error)
    } finally {
      setActiveReviewId(null)
    }
  }

  const handleBulkModerate = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return

    try {
      await bulkModerateMutation.mutateAsync({
        reviewIds: Array.from(selectedIds),
        action,
      })
      setSelectedIds(new Set())
      if (onRefetch) {
        await onRefetch()
      }
    } catch (error) {
      console.error("Bulk moderation error:", error)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading pending reviews...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {errorMessage}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium">All caught up!</h3>
        <p className="text-muted-foreground">No reviews pending moderation</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === reviews.length}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : "Select all"}
          </span>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkModerate("reject")}
              disabled={bulkModerateMutation.isPending}
              className="text-red-500 hover:text-red-600"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject Selected
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkModerate("approve")}
              disabled={bulkModerateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve Selected
            </Button>
          </div>
        )}
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="relative">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Checkbox */}
                <div className="pt-1">
                  <Checkbox
                    checked={selectedIds.has(review.id)}
                    onCheckedChange={() => toggleSelect(review.id)}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {review.userName || review.userEmail || "Anonymous"}
                        </span>
                        {review.orderId && (
                          <Badge variant="outline" className="text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {renderStars(review.rating)}
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(review.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/ops/products/${review.productId}`}
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {review.productName}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Review Content */}
                  <div>
                    {review.title && (
                      <h4 className="font-medium mb-1">{review.title}</h4>
                    )}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {review.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModerate(review.id, "reject")}
                      disabled={
                        activeReviewId === review.id ||
                        moderateMutation.isPending ||
                        bulkModerateMutation.isPending
                      }
                      className="text-red-500 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleModerate(review.id, "approve")}
                      disabled={
                        activeReviewId === review.id ||
                        moderateMutation.isPending ||
                        bulkModerateMutation.isPending
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
