"use client"

import { useRef } from "react"

import Link from "next/link"

import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react"

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  createdAt: Date
  productName: string
  productSlug: string
  userName: string | null
  userImage: string | null
}

interface ReviewsSectionProps {
  reviews: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-200"
          }`}
        />
      ))}
    </div>
  )
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (reviews.length === 0) return null

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.firstElementChild
      ? (scrollRef.current.firstElementChild as HTMLElement).offsetWidth + 16
      : 340
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    })
  }

  return (
    <section className="bg-zinc-50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 sm:text-sm">
              What People Say
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
              Customer Reviews
            </h2>
          </div>

          {/* Scroll arrows — visible on sm+ */}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => scroll("left")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-700"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:gap-4 sm:px-6 sm:snap-none"
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="w-72 shrink-0 snap-start sm:w-80 lg:w-96"
            >
              <div className="flex h-full flex-col rounded-2xl border border-zinc-100 bg-white p-5 sm:p-6">
                {/* Quote icon */}
                <Quote className="mb-3 h-5 w-5 text-zinc-200" />

                {/* Stars */}
                <StarRating rating={review.rating} />

                {/* Title */}
                {review.title && (
                  <h3 className="mt-3 text-sm font-semibold text-zinc-900">
                    {review.title}
                  </h3>
                )}

                {/* Content */}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500 line-clamp-4">
                  {review.content || "Great product!"}
                </p>

                {/* Product */}
                <Link
                  href={`/products/${review.productSlug}`}
                  className="mt-3 text-xs font-medium text-zinc-400 hover:text-zinc-600 hover:underline"
                >
                  on {review.productName}
                </Link>

                {/* Reviewer */}
                <div className="mt-4 flex items-center gap-3 border-t border-zinc-50 pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
                    {getInitials(review.userName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {review.userName || "Anonymous"}
                    </p>
                    <p className="text-xs text-zinc-400">Verified Buyer</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
