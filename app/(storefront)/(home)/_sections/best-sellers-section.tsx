"use client"

import { useRef } from "react"
import Link from "next/link"

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

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

interface BestSellersSectionProps {
  products: Product[]
}

export function BestSellersSection({ products }: BestSellersSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.firstElementChild
      ? (scrollRef.current.firstElementChild as HTMLElement).offsetWidth + 32
      : 300
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    })
  }

  return (
    <section className="section-container">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 sm:text-sm">
            Most Popular
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
            Best Sellers
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll arrows — visible on sm+ */}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => scroll("left")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Link
            href="/products?sort=popular"
            className="ml-2 hidden items-center gap-1 text-sm font-medium text-zinc-900 hover:underline sm:inline-flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Horizontal scroll — snap on mobile, free on desktop */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-8 overflow-x-auto px-4 pb-5 scrollbar-none md:snap-none py-4"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[80%] min-w-70 max-w-95 shrink-0 snap-start md:w-[calc((100%-2rem)/2.5)] lg:w-[calc((100%-4rem)/3.5)] xl:w-95"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Mobile view all — large tap target */}
      <div className="mt-6 text-center sm:hidden">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full rounded-full"
        >
          <Link href="/products?sort=popular">
            View All Best Sellers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
