import Link from "next/link"

import { ChevronLeft, ChevronRight, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { searchProducts } from "@/lib/actions/search"

import { ProductCard } from "../_components/product-card"

interface SearchResultsProps {
  query: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  sort?: "relevance" | "price-asc" | "price-desc" | "newest"
  page?: number
}

export async function SearchResults({
  query,
  category,
  brand,
  minPrice,
  maxPrice,
  sort = "relevance",
  page = 1,
}: SearchResultsProps) {
  const results = await searchProducts({
    query,
    category,
    brand,
    minPrice,
    maxPrice,
    sort,
    page,
    limit: 12,
  })

  const { products, pagination } = results

  // Build URL with current params
  const buildUrl = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category) params.set("category", category)
    if (brand) params.set("brand", brand)
    if (minPrice) params.set("minPrice", minPrice.toString())
    if (maxPrice) params.set("maxPrice", maxPrice.toString())

    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value.toString())
      }
    })

    return `/search?${params.toString()}`
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold">No results found</h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          {query
            ? `We couldn't find any products matching "${query}". Try different keywords or browse our categories.`
            : "Enter a search term to find products."}
        </p>
        <div className="mt-6 flex gap-4">
          <Button asChild>
            <Link href="/products">Browse All Products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/categories">View Categories</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with count and sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * 12 + 1}-{Math.min(page * 12, pagination.total)}{" "}
          of {pagination.total} results
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          {[
            { value: "relevance", label: "Relevance" },
            { value: "newest", label: "Newest" },
            { value: "price-asc", label: "Price: Low to High" },
            { value: "price-desc", label: "Price: High to Low" },
          ].map((option) => (
            <Button
              key={option.value}
              variant={sort === option.value ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={buildUrl({ sort: option.value, page: 1 })}>
                {option.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            asChild={page > 1}
          >
            {page > 1 ? (
              <Link href={buildUrl({ page: page - 1, sort })}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and adjacent pages
                return (
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - page) <= 1
                )
              })
              .map((p, i, arr) => {
                // Add ellipsis
                const showEllipsisBefore = i > 0 && p - arr[i - 1] > 1
                return (
                  <span key={p} className="flex items-center">
                    {showEllipsisBefore && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      asChild={p !== page}
                    >
                      {p !== page ? (
                        <Link href={buildUrl({ page: p, sort })}>{p}</Link>
                      ) : (
                        <span>{p}</span>
                      )}
                    </Button>
                  </span>
                )
              })}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={page >= pagination.totalPages}
            asChild={page < pagination.totalPages}
          >
            {page < pagination.totalPages ? (
              <Link href={buildUrl({ page: page + 1, sort })}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
