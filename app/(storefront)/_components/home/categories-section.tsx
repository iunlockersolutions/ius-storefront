import Image from "next/image"
import Link from "next/link"

import { formatCurrency } from "@/lib/utils"

// Fallback images for categories that don't have images yet
const CATEGORY_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop", // laptop
  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=200&h=200&fit=crop", // phone
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200&h=200&fit=crop", // watch
  "https://images.unsplash.com/photo-1588423771073-b8903fdes646?w=200&h=200&fit=crop", // headphones
  "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop", // tablet
  "https://images.unsplash.com/photo-1587825140708-dfaf18c11727?w=200&h=200&fit=crop", // accessories
]

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  productCount: number
  startingPrice?: string | null
}

interface CategoriesSectionProps {
  categories: Category[]
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null

  return (
    <section className="border-b border-zinc-100 py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Horizontal scrollable on mobile, centered grid on desktop */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex shrink-0 flex-col items-center gap-2 px-2 py-2 sm:px-0"
              style={{ minWidth: "5.5rem" }}
            >
              {/* Image circle */}
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-50 transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20">
                <Image
                  src={
                    category.image ||
                    CATEGORY_FALLBACK_IMAGES[
                      index % CATEGORY_FALLBACK_IMAGES.length
                    ]
                  }
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              {/* Name */}
              <span className="text-center text-xs font-medium text-zinc-900 sm:text-sm">
                {category.name}
              </span>

              {/* Starting price or product count */}
              <span className="text-center text-[11px] text-zinc-400 sm:text-xs">
                {category.startingPrice
                  ? `From ${formatCurrency(Number(category.startingPrice))}`
                  : `${category.productCount} ${category.productCount === 1 ? "item" : "items"}`}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
