import { Percent, Tag } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { getDealProducts } from "@/lib/actions/storefront"

export const metadata = {
  title: "Deals & Offers",
  description: "Shop our best deals and discounts on premium products",
}

export default async function DealsPage() {
  const deals = await getDealProducts(24)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-red-500 to-orange-500 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Deals & Offers</h1>
            <p className="text-white/80">Save big on our best products</p>
          </div>
        </div>
        <p className="text-lg text-white/90 max-w-2xl">
          Discover amazing discounts on our top-quality products. Limited time
          offers you don&apos;t want to miss!
        </p>
      </div>

      {/* Deals Grid */}
      {deals.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">No Active Deals</h2>
          <p className="text-muted-foreground mt-2">
            Check back soon for new deals and offers!
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {deals.length} {deals.length === 1 ? "deal" : "deals"} available
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {deals.map((product) => {
              const discount = product.compareAtPrice
                ? Math.round(
                    ((parseFloat(product.compareAtPrice) -
                      parseFloat(product.basePrice)) /
                      parseFloat(product.compareAtPrice)) *
                      100,
                  )
                : 0

              return (
                <div key={product.id} className="relative">
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{discount}%
                    </div>
                  )}
                  <ProductCard product={product} />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
