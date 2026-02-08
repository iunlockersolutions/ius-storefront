import { Suspense } from "react"

import { ReviewModerationQueue } from "@/components/admin/reviews/review-moderation-queue"
import { ReviewStats } from "@/components/admin/reviews/review-stats"
import { ReviewsTable } from "@/components/admin/reviews/reviews-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPendingReviews,
  getReviews,
  getReviewStats,
} from "@/lib/actions/review"

function ReviewStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-muted animate-pulse rounded" />
      <div className="border rounded-lg">
        <div className="h-10 border-b bg-muted/50" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 border-b flex items-center px-4">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function ReviewStatsSection() {
  const stats = await getReviewStats()
  return <ReviewStats stats={stats} />
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function ReviewsTableSection({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const page = Number(searchParams.page) || 1
  const status = searchParams.status
  const rating = searchParams.rating ? Number(searchParams.rating) : undefined
  const search = searchParams.search

  const { reviews, pagination } = await getReviews({
    page,
    status,
    rating,
    search,
  })

  return <ReviewsTable reviews={reviews} pagination={pagination} />
}

async function ModerationQueueSection() {
  const pendingReviews = await getPendingReviews()
  return <ReviewModerationQueue reviews={pendingReviews} />
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = (params.tab as string) || "pending"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">
          Moderate customer reviews and manage feedback
        </p>
      </div>

      <Suspense fallback={<ReviewStatsSkeleton />}>
        <ReviewStatsSection />
      </Suspense>

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
              <Suspense fallback={<TableSkeleton />}>
                <ModerationQueueSection />
              </Suspense>
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
              <Suspense fallback={<TableSkeleton />}>
                <ReviewsTableSection
                  searchParams={params as Record<string, string | undefined>}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
