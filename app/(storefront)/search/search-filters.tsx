"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface SearchFiltersProps {
  currentCategory?: string
  minPrice?: string
  maxPrice?: string
}

export function SearchFilters({
  currentCategory,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
}: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [minPrice, setMinPrice] = useState(initialMinPrice || "")
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice || "")

  const hasFilters = currentCategory || initialMinPrice || initialMaxPrice

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (minPrice) {
      params.set("minPrice", minPrice)
    } else {
      params.delete("minPrice")
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice)
    } else {
      params.delete("maxPrice")
    }

    params.set("page", "1") // Reset to page 1
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    router.push(`/search?${params.toString()}`)
  }

  const removeCategory = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category")
    params.set("page", "1")
    router.push(`/search?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filters */}
        {hasFilters && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Filters</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {currentCategory}
                  <button onClick={removeCategory}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(initialMinPrice || initialMaxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {initialMinPrice && initialMaxPrice
                    ? `Rs. ${initialMinPrice} - Rs. ${initialMaxPrice}`
                    : initialMinPrice
                      ? `Min: Rs. ${initialMinPrice}`
                      : `Max: Rs. ${initialMaxPrice}`}
                </span>
              )}
            </div>
            <Separator className="mt-4" />
          </div>
        )}

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Price Range</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <Button className="w-full mt-3" size="sm" onClick={applyFilters}>
            Apply Price Filter
          </Button>
        </div>

        <Separator />

        {/* Quick Price Ranges */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Quick Filters
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Under Rs. 5,000", min: "", max: "5000" },
              { label: "Rs. 5K - 15K", min: "5000", max: "15000" },
              { label: "Rs. 15K - 50K", min: "15000", max: "50000" },
              { label: "Over Rs. 50K", min: "50000", max: "" },
            ].map((range) => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setMinPrice(range.min)
                  setMaxPrice(range.max)
                  const params = new URLSearchParams(searchParams.toString())
                  if (range.min) params.set("minPrice", range.min)
                  else params.delete("minPrice")
                  if (range.max) params.set("maxPrice", range.max)
                  else params.delete("maxPrice")
                  params.set("page", "1")
                  router.push(`/search?${params.toString()}`)
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
