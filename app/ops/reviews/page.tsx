import { ReviewsPageClient } from "./_components/reviews-page-client"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = (params.tab as string) || "pending"
  const page = Number(params.page) || 1
  const status = typeof params.status === "string" ? params.status : undefined
  const rating = params.rating ? Number(params.rating) : undefined
  const search = typeof params.search === "string" ? params.search : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">
          Moderate customer reviews and manage feedback
        </p>
      </div>

      <ReviewsPageClient
        tab={tab}
        page={page}
        status={status}
        rating={Number.isFinite(rating) ? rating : undefined}
        search={search}
      />
    </div>
  )
}
