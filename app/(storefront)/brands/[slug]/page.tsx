import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronLeft, ChevronRight, Package, Store } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { ProductsFilter } from "@/components/storefront/products-filter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBrandBySlug } from "@/lib/actions/brand"
import { getStorefrontProducts } from "@/lib/actions/product"

interface BrandPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    page?: string
    sort?: string
  }>
}

export async function generateMetadata({ params }: BrandPageProps) {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)

  if (!brand) {
    return { title: "Brand Not Found" }
  }

  return {
    title: brand.metaTitle || `${brand.name} | IUS Shop`,
    description:
      brand.metaDescription ||
      brand.description ||
      `Browse products from ${brand.name}`,
  }
}

export default async function BrandPage({
  params,
  searchParams,
}: BrandPageProps) {
  const { slug } = await params
  const { page: pageStr, sort } = await searchParams
  const brand = await getBrandBySlug(slug)

  if (!brand) {
    notFound()
  }

  const page = pageStr ? parseInt(pageStr) : 1
  const sortBy =
    (sort as "newest" | "price-low" | "price-high" | "name") || "newest"

  const { products, total, totalPages } = await getStorefrontProducts({
    brandSlug: brand.slug,
    page,
    limit: 12,
    sortBy,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/brands" className="hover:text-foreground">
          Brands
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{brand.name}</span>
      </nav>

      <div className="mb-8 rounded-2xl border bg-muted/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-background">
            {brand.logo ? (
              <div className="relative h-16 w-16">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </div>
            ) : (
              <Store className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
            {brand.description && (
              <p className="mt-2 max-w-3xl text-muted-foreground">
                {brand.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {total} {total === 1 ? "product" : "products"}
              </Badge>
              {brand.websiteUrl && (
                <Badge variant="outline" asChild>
                  <a href={brand.websiteUrl} target="_blank" rel="noreferrer">
                    Official website
                  </a>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductsFilter
        currentSort={sortBy}
        baseUrl={`/brands/${slug}`}
        total={total}
      />

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">No products found</h2>
          <p className="mt-2 text-muted-foreground">
            There are no active products for this brand yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/brands">Browse Other Brands</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                <Link
                  href={`/brands/${slug}?page=${page - 1}${sort ? `&sort=${sort}` : ""}`}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Link>
              </Button>
              <span className="px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={page >= totalPages}
              >
                <Link
                  href={`/brands/${slug}?page=${page + 1}${sort ? `&sort=${sort}` : ""}`}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
