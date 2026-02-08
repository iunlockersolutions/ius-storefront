import Link from "next/link"

import { ChevronLeft, ChevronRight, Package, Search } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { ProductsFilter } from "@/components/storefront/products-filter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getActiveCategories } from "@/lib/actions/category"
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
  }>
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { page: pageStr, sort, search, category } = await searchParams

  const page = pageStr ? parseInt(pageStr) : 1
  const sortBy =
    (sort as "newest" | "price-low" | "price-high" | "name") || "newest"

  const [productsResult, categories] = await Promise.all([
    getStorefrontProducts({
      page,
      limit: 12,
      sortBy,
      search: search || undefined,
      categoryId: category || undefined,
    }),
    getActiveCategories(),
  ])

  const { products, total, totalPages } = productsResult

  // Build query string for pagination
  const buildQueryString = (newPage: number) => {
    const params = new URLSearchParams()
    params.set("page", newPage.toString())
    if (sort) params.set("sort", sort)
    if (search) params.set("search", search)
    if (category) params.set("category", category)
    return params.toString()
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
          <Button type="submit">Search</Button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/products${sort ? `?sort=${sort}` : ""}${search ? `${sort ? "&" : "?"}search=${search}` : ""}`}
          >
            <Badge
              variant={!category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10"
            >
              All
            </Badge>
          </Link>
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}${sort ? `&sort=${sort}` : ""}${search ? `&search=${search}` : ""}`}
            >
              <Badge
                variant={category === cat.id ? "default" : "outline"}
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

      {/* Active Search Badge */}
      {search && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Searching for:</span>
          <Badge variant="secondary" className="flex items-center gap-1">
            &quot;{search}&quot;
            <Link
              href={`/products${sort ? `?sort=${sort}` : ""}${category ? `${sort ? "&" : "?"}category=${category}` : ""}`}
              className="ml-1 hover:text-destructive"
            >
              ×
            </Link>
          </Badge>
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
                  href={`/products?${buildQueryString(page - 1)}`}
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
                  href={`/products?${buildQueryString(page + 1)}`}
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
