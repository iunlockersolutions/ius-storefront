import Image from "next/image"
import Link from "next/link"

import { ChevronRight, Store } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveBrands } from "@/lib/actions/brand"

export const metadata = {
  title: "Brands | IUS Shop",
  description: "Browse products by brand",
}

export default async function BrandsPage() {
  const brands = await getActiveBrands({ failSoft: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
        <p className="mt-2 text-muted-foreground">
          Shop by brand and explore each collection in one place.
        </p>
      </div>

      {brands.length === 0 ? (
        <div className="py-12 text-center">
          <Store className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-medium">No brands available</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Active brands will appear here once they are published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/brands/${brand.slug}`}>
              <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-lg">
                {brand.logo ? (
                  <div className="relative aspect-3/2 overflow-hidden rounded-t-lg bg-muted">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      className="object-contain p-6 transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <CardHeader className="pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                )}
                <CardContent className={brand.logo ? "pt-4" : "pt-0"}>
                  <CardTitle className="text-lg transition-colors group-hover:text-primary">
                    {brand.name}
                  </CardTitle>
                  {brand.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {brand.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary">
                      {brand.productCount}{" "}
                      {brand.productCount === 1 ? "product" : "products"}
                    </Badge>
                    <span className="flex items-center text-sm font-medium text-primary">
                      View brand
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
