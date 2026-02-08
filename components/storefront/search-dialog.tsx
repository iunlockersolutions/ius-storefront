"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Clock, Grid3X3, Package, Search, TrendingUp, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getPopularSearchTerms,
  getSearchSuggestions,
} from "@/lib/actions/search"

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<{
    products: { id: string; name: string; slug: string }[]
    categories: { id: string; name: string; slug: string }[]
  }>({ products: [], categories: [] })
  const [popularTerms, setPopularTerms] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches")
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    }
  }, [])

  // Load popular terms
  useEffect(() => {
    getPopularSearchTerms().then(setPopularTerms)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions({ products: [], categories: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await getSearchSuggestions(query)
        setSuggestions(results)
      } catch (error) {
        console.error("Search suggestions error:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return

      // Save to recent searches
      const newRecent = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 5)
      setRecentSearches(newRecent)
      localStorage.setItem("recentSearches", JSON.stringify(newRecent))

      // Navigate to search results
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      onClose()
    },
    [router, onClose, recentSearches],
  )

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-2xl rounded-xl bg-white shadow-2xl dark:bg-neutral-950 sm:inset-x-auto">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b p-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search products, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(query)
              } else if (e.key === "Escape") {
                onClose()
              }
            }}
            className="flex-1 border-0 bg-transparent p-0 text-lg focus-visible:ring-0 placeholder:text-muted-foreground"
          />
          {query && (
            <Button variant="ghost" size="icon" onClick={() => setQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {query.length >= 2 ? (
            // Search Results
            <div className="space-y-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : (
                <>
                  {/* Product Suggestions */}
                  {suggestions.products.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        Products
                      </h3>
                      <div className="space-y-1">
                        {suggestions.products.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                          >
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{product.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Suggestions */}
                  {suggestions.categories.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        Categories
                      </h3>
                      <div className="space-y-1">
                        {suggestions.categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                          >
                            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                            <span>{category.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View All Results */}
                  {(suggestions.products.length > 0 ||
                    suggestions.categories.length > 0) && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSearch(query)}
                    >
                      View all results for &quot;{query}&quot;
                    </Button>
                  )}

                  {/* No Results */}
                  {suggestions.products.length === 0 &&
                    suggestions.categories.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        <p>No results found for &quot;{query}&quot;</p>
                        <p className="mt-1 text-sm">
                          Try different keywords or browse categories
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>
          ) : (
            // Default State (Recent + Popular)
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium uppercase text-muted-foreground">
                      Recent Searches
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(term)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted transition-colors"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTerms.map((term, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-muted-foreground/20"
                      onClick={() => handleSearch(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
