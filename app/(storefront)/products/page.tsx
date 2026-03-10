import Link from "next/link"

import { ChevronLeft, ChevronRight, Package, Search } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { ProductsFilter } from "@/components/storefront/products-filter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getActiveBrands } from "@/lib/actions/brand"
import { getActiveCategoriesFlat } from "@/lib/actions/category"
import { getStorefrontProducts } from "@/lib/actions/product"

export const metadata = {
  title: "Products | IUS Shop",
  description: "Browse our complete collection of products",
}

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    search?: string
    category?: string
    brand?: string
    featured?: string
  }>
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const {
    page: pageStr,
    sort,
    search,
    category,
    brand,
    featured,
  } = await searchParams

  const page = pageStr ? parseInt(pageStr) : 1
  const sortBy =
    (sort as "newest" | "price-low" | "price-high" | "name") || "newest"
  const featuredOnly = featured === "true"

  const [productsResult, categories, brands] = await Promise.all([
    getStorefrontProducts({
      page,
      limit: 12,
      sortBy,
      search: search || undefined,
      categorySlug: category || undefined,
      brandSlug: brand || undefined,
      featured: featuredOnly,
    }),
    getActiveCategoriesFlat(),
    getActiveBrands({ failSoft: true }),
  ])

  const { products, total, totalPages } = productsResult

  const buildProductsHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const nextValues = {
      page: undefined,
      sort,
      search,
      category,
      brand,
      featured: featuredOnly ? "true" : undefined,
      ...overrides,
    }

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })

    const query = params.toString()
    return query ? `/products?${query}` : "/products"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our complete collection of quality products
        </p>
      </div>

      {/* Search & Category Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form className="flex-1 flex gap-2" action="/products">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search products..."
              defaultValue={search || ""}
              className="pl-10"
            />
          </div>
          {sort && <input type="hidden" name="sort" value={sort} />}
          {category && <input type="hidden" name="category" value={category} />}
          {brand && <input type="hidden" name="brand" value={brand} />}
          {featuredOnly && <input type="hidden" name="featured" value="true" />}
          <Button type="submit">Search</Button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Link href={buildProductsHref({ category: undefined })}>
            <Badge
              variant={!category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10"
            >
              All
            </Badge>
          </Link>
          {categories.slice(0, 5).map((cat) => (
            <Link key={cat.id} href={buildProductsHref({ category: cat.slug })}>
              <Badge
                variant={category === cat.slug ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
          {categories.length > 5 && (
            <Link href="/categories">
              <Badge variant="secondary" className="cursor-pointer">
                +{categories.length - 5} more
              </Badge>
            </Link>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="secondary">Brands</Badge>
        <Link href={buildProductsHref({ brand: undefined })}>
          <Badge
            variant={!brand ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/10"
          >
            All Brands
          </Badge>
        </Link>
        {brands.slice(0, 6).map((brandOption) => (
          <Link
            key={brandOption.id}
            href={buildProductsHref({ brand: brandOption.slug })}
          >
            <Badge
              variant={brand === brandOption.slug ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10"
            >
              {brandOption.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Active Search Badge */}
      {(search || category || brand || featuredOnly) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: &quot;{search}&quot;
              <Link
                href={buildProductsHref({ search: undefined })}
                className="ml-1 hover:text-destructive"
              >
                ×
              </Link>
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category:{" "}
              {categories.find((item) => item.slug === category)?.name ||
                category}
              <Link
                href={buildProductsHref({ category: undefined })}
                className="ml-1 hover:text-destructive"
              >
                ×
              </Link>
            </Badge>
          )}
          {brand && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Brand: {brands.find((item) => item.slug === brand)?.name || brand}
              <Link
                href={buildProductsHref({ brand: undefined })}
                className="ml-1 hover:text-destructive"
              >
                ×
              </Link>
            </Badge>
          )}
          {featuredOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Featured
              <Link
                href={buildProductsHref({ featured: undefined })}
                className="ml-1 hover:text-destructive"
              >
                ×
              </Link>
            </Badge>
          )}
        </div>
      )}

      {/* Filters & Sorting */}
      <ProductsFilter currentSort={sortBy} baseUrl="/products" total={total} />

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">No products found</h2>
          <p className="mt-2 text-muted-foreground">
            {search
              ? `No products match "${search}". Try a different search term.`
              : "Check back soon for new products."}
          </p>
          {search && (
            <Button asChild className="mt-6">
              <Link href="/products">Clear Search</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                <Link
                  href={buildProductsHref({ page: (page - 1).toString() })}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
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
                  href={buildProductsHref({ page: (page + 1).toString() })}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
