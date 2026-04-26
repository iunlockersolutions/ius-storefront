"use client"

import { useRef } from "react"
import Link from "next/link"

import { ArrowRight, ChevronLeft, ChevronRight, Flame } from "lucide-react"

import { ProductCard } from "@/app/(storefront)/_components/product-card"
import { Button } from "@/components/ui/button"

interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  basePrice: string
  compareAtPrice: string | null
  isFeatured: boolean
  image: string | null
  brand?: {
    id: string | null
    name: string | null
    slug: string | null
  } | null
}

interface DealsSectionProps {
  products: Product[]
}

export function DealsSection({ products }: DealsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.firstElementChild
      ? (scrollRef.current.firstElementChild as HTMLElement).offsetWidth + 12
      : 200
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    })
  }

  return (
    <section className="section-container">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 sm:text-sm">
              Limited Time
            </p>
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
            Deals & Promotions
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => scroll("left")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link
            href="/deals"
            className="ml-2 hidden items-center gap-1 text-sm font-medium text-white hover:underline sm:inline-flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:gap-4 sm:px-6 sm:snap-none"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-44 shrink-0 snap-start sm:w-56 lg:w-64"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Mobile view all */}
      <div className="mt-6 text-center sm:hidden">
        <Button
          asChild
          size="lg"
          className="w-full rounded-full bg-white font-medium text-zinc-900 hover:bg-zinc-100"
        >
          <Link href="/deals">
            View All Deals
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
