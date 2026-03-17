"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminReviewsQuery } from "@/services/queries/use-admin-reviews-query"
import { usePendingReviewsQuery } from "@/services/queries/use-pending-reviews-query"
import { useReviewStatsQuery } from "@/services/queries/use-review-stats-query"

import { ReviewModerationQueue } from "./review-moderation-queue"
import { ReviewStats } from "./review-stats"
import { ReviewsTable } from "./reviews-table"

interface ReviewsPageClientProps {
  tab: string
  page: number
  status?: string
  rating?: number
  search?: string
}

export function ReviewsPageClient({
  tab,
  page,
  status,
  rating,
  search,
}: ReviewsPageClientProps) {
  const statsQuery = useReviewStatsQuery()
  const reviewsQuery = useAdminReviewsQuery({
    page,
    status,
    rating,
    search,
  })
  const pendingQuery = usePendingReviewsQuery()

  return (
    <>
      <ReviewStats
        stats={
          statsQuery.data ?? {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
            averageRating: 0,
          }
        }
      />

      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Moderation Queue</TabsTrigger>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                Reviews awaiting moderation approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewModerationQueue
                reviews={pendingQuery.data ?? []}
                isLoading={pendingQuery.isLoading || pendingQuery.isFetching}
                errorMessage={
                  pendingQuery.error instanceof Error
                    ? pendingQuery.error.message
                    : null
                }
                onRefetch={pendingQuery.refetch}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Reviews</CardTitle>
              <CardDescription>
                Browse and manage all customer reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsTable
                reviews={reviewsQuery.data?.reviews ?? []}
                pagination={
                  reviewsQuery.data?.pagination ?? {
                    page,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                  }
                }
                isLoading={reviewsQuery.isLoading || reviewsQuery.isFetching}
                errorMessage={
                  reviewsQuery.error instanceof Error
                    ? reviewsQuery.error.message
                    : null
                }
                onRefetch={reviewsQuery.refetch}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
