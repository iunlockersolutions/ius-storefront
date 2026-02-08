import Link from "next/link"

import { ArrowRight, Clock, Percent } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { Badge } from "@/components/ui/badge"
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
}

interface DealsSectionProps {
  products: Product[]
}

export function DealsSection({ products }: DealsSectionProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Percent className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl flex items-center gap-2">
                Hot Deals
                <Badge variant="destructive" className="ml-2">
                  Save Big
                </Badge>
              </h2>
              <p className="mt-1 text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Limited time offers
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/deals">
              View All Deals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
