import Link from "next/link"

import { ArrowRight } from "lucide-react"

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

interface FeaturedProductsSectionProps {
  products: Product[]
}

export function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 sm:text-sm">
              Curated for You
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden items-center gap-1 text-sm font-medium text-zinc-900 hover:underline sm:inline-flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Product grid — 2 cols mobile, 3 on sm, 4 on lg */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Mobile view all — full-width tap target */}
        <div className="mt-6 text-center sm:hidden">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full rounded-full"
          >
            <Link href="/products?featured=true">
              View All Featured
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
