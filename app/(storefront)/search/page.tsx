import { Suspense } from "react"

import { SearchFilters } from "./search-filters"
import { SearchResults } from "./search-results"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ""

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {query ? `Search results for "${query}"` : "Search Products"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <SearchFilters
            currentCategory={params.category}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <SearchResults
              query={query}
              category={params.category}
              minPrice={
                params.minPrice ? parseFloat(params.minPrice) : undefined
              }
              maxPrice={
                params.maxPrice ? parseFloat(params.maxPrice) : undefined
              }
              sort={
                params.sort as
                  | "relevance"
                  | "price-asc"
                  | "price-desc"
                  | "newest"
                  | undefined
              }
              page={params.page ? parseInt(params.page) : 1}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
