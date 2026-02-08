import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"

interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  basePrice: string
  compareAtPrice: string | null
  isFeatured: boolean
  image: string | null
}

interface ProductGridSectionProps {
  title: string
  subtitle?: string
  products: Product[]
  viewAllLink?: string
  viewAllText?: string
  className?: string
}

export function ProductGridSection({
  title,
  subtitle,
  products,
  viewAllLink,
  viewAllText = "View All",
  className = "",
}: ProductGridSectionProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {viewAllText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {viewAllLink && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {viewAllText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
