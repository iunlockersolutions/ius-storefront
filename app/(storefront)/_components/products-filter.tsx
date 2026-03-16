"use client"

import { useRouter, useSearchParams } from "next/navigation"

import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Clock,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProductsFilterProps {
  currentSort: string
  baseUrl: string
  total: number
}

const sortOptions = [
  { value: "newest", label: "Newest", icon: Clock },
  { value: "price-low", label: "Price: Low to High", icon: ArrowUpNarrowWide },
  {
    value: "price-high",
    label: "Price: High to Low",
    icon: ArrowDownWideNarrow,
  },
  { value: "name", label: "Name: A to Z", icon: ArrowDownAZ },
]

export function ProductsFilter({
  currentSort,
  baseUrl,
  total,
}: ProductsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    params.set("page", "1") // Reset to first page on sort change
    router.push(`${baseUrl}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between py-4 border-y">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{total}</span>{" "}
        products
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Sort by:
        </span>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
