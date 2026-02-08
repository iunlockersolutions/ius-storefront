import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronLeft, ChevronRight, FolderOpen, Package } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { ProductsFilter } from "@/components/storefront/products-filter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCategoryBySlug } from "@/lib/actions/category"
import { getStorefrontProducts } from "@/lib/actions/product"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    page?: string
    sort?: string
  }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return { title: "Category Not Found" }
  }

  return {
    title: `${category.name} | IUS Shop`,
    description: category.description || `Browse ${category.name} products`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params
  const { page: pageStr, sort } = await searchParams

  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const page = pageStr ? parseInt(pageStr) : 1
  const sortBy =
    (sort as "newest" | "price-low" | "price-high" | "name") || "newest"

  const { products, total, totalPages } = await getStorefrontProducts({
    categoryId: category.id,
    page,
    limit: 12,
    sortBy,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/categories" className="hover:text-foreground">
          Categories
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        )}
        <Badge variant="secondary" className="mt-3">
          {total} {total === 1 ? "product" : "products"}
        </Badge>
      </div>

      {/* Filters & Sorting */}
      <ProductsFilter
        currentSort={sortBy}
        baseUrl={`/categories/${slug}`}
        total={total}
      />

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">No products found</h2>
          <p className="mt-2 text-muted-foreground">
            There are no products in this category yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/categories">Browse Other Categories</Link>
          </Button>
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
                  href={`/categories/${slug}?page=${page - 1}${sort ? `&sort=${sort}` : ""}`}
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
                  href={`/categories/${slug}?page=${page + 1}${sort ? `&sort=${sort}` : ""}`}
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
