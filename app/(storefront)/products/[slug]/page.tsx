import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronRight } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { ProductGallery } from "@/components/storefront/product-gallery"
import { ProductInfo } from "@/components/storefront/product-info"
import { ProductReviews } from "@/components/storefront/product-reviews"
import { Badge } from "@/components/ui/badge"
import { isProductFavorited } from "@/lib/actions/favorites"
import { getProductBySlug, getStorefrontProducts } from "@/lib/actions/product"
import {
  canUserReview,
  getProductReviews,
  getProductReviewStats,
} from "@/lib/actions/product-reviews"
import { getServerSession } from "@/lib/auth/rbac"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.name} | IUS Shop`,
    description:
      product.shortDescription ||
      product.description?.slice(0, 160) ||
      `Buy ${product.name}`,
    openGraph: {
      title: product.name,
      description:
        product.shortDescription || product.description?.slice(0, 160),
      images: product.images.length > 0 ? [product.images[0].url] : undefined,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  // Get session for authentication check
  const session = await getServerSession()
  const isAuthenticated = !!session?.user?.id

  // Fetch data in parallel
  const [
    isFavorited,
    relatedProductsData,
    reviewsData,
    reviewStats,
    reviewPermission,
  ] = await Promise.all([
    isProductFavorited(product.id),
    product.categoryId
      ? getStorefrontProducts({ categoryId: product.categoryId, limit: 4 })
      : Promise.resolve(null),
    getProductReviews(product.id),
    getProductReviewStats(product.id),
    canUserReview(product.id),
  ])

  // Filter out current product from related
  const filteredRelated =
    relatedProductsData?.products.filter((p) => p.id !== product.id) || []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-50">
          {product.name}
        </span>
      </nav>

      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Product Info */}
        <ProductInfo product={product} initialIsFavorited={isFavorited} />
      </div>

      {/* Product Description */}
      {product.description && (
        <div className="mt-12 max-w-3xl">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="prose prose-neutral max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Product Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <dt className="text-sm text-muted-foreground">Category</dt>
            <dd className="mt-1 font-medium">
              {product.category ? (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="text-primary hover:underline"
                >
                  {product.category.name}
                </Link>
              ) : (
                "Uncategorized"
              )}
            </dd>
          </div>
          {product.variants.length > 0 && (
            <div className="border rounded-lg p-4">
              <dt className="text-sm text-muted-foreground">Variants</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-1">
                  {product.variants.slice(0, 5).map((v) => (
                    <Badge key={v.id} variant="secondary">
                      {v.name}
                    </Badge>
                  ))}
                  {product.variants.length > 5 && (
                    <Badge variant="outline">
                      +{product.variants.length - 5} more
                    </Badge>
                  )}
                </div>
              </dd>
            </div>
          )}
          {product.metaTitle && (
            <div className="border rounded-lg p-4 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">SKU</dt>
              <dd className="mt-1 font-mono text-sm">
                {product.variants[0]?.sku || product.slug.toUpperCase()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Related Products */}
      {filteredRelated.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Related Products</h2>
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRelated.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      <div className="mt-16">
        <ProductReviews
          productId={product.id}
          reviews={reviewsData.reviews}
          stats={reviewStats}
          canReview={reviewPermission.canReview}
          reviewMessage={reviewPermission.reason}
          hasPurchased={reviewPermission.hasPurchased}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}
