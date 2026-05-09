import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronRight } from "lucide-react"

import { ProductCard } from "@/app/(storefront)/_components/product-card"
import { ProductDetailContent } from "@/app/(storefront)/products/_components/product-detail-content"
import { ProductDescription } from "@/components/shared/markdown-description"
import { isProductFavorited } from "@/lib/actions/favorites"
import { getProductBySlug, getStorefrontProducts } from "@/lib/actions/product"
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
    title: product.metaTitle || `${product.name} | EvoluX`,
    description:
      product.metaDescription ||
      product.shortDescription ||
      product.description?.slice(0, 160) ||
      `Buy ${product.name}`,
    openGraph: {
      title: product.name,
      description:
        product.shortDescription || product.description?.slice(0, 160),
      images:
        product.media
          ?.filter(
            (item) =>
              item.kind === "image" && item.variantAssignment.mode === "all",
          )
          .sort((left, right) => {
            if (left.isPrimaryImage) return -1
            if (right.isPrimaryImage) return 1
            return left.sortOrder - right.sortOrder
          })
          .slice(0, 1)
          .map((item) => item.url) || undefined,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const [isFavorited, relatedProductsData] = await Promise.all([
    isProductFavorited(product.id),
    product.primaryCategoryId
      ? getStorefrontProducts({
          primaryCategoryId: product.primaryCategoryId,
          limit: 4,
        })
      : Promise.resolve(null),
  ])

  const filteredRelated =
    relatedProductsData?.products.filter((p) => p.id !== product.id) || []

  return (
    <div className="py-8">
      <nav className="container mx-auto px-4 mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.primaryCategory && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/categories/${product.primaryCategory.slug}`}
              className="hover:text-foreground"
            >
              {product.primaryCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-50">
          {product.name}
        </span>
      </nav>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <ProductDetailContent
          product={product}
          initialIsFavorited={isFavorited}
        />
      </div>

      {product.description && (
        <section className="container mx-auto px-4 mt-20">
          <ProductDescription html={product.description} />
        </section>
      )}

      {filteredRelated.length > 0 && (
        <div className="container mx-auto px-4 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Related Products</h2>
            {product.primaryCategory && (
              <Link
                href={`/categories/${product.primaryCategory.slug}`}
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
      {/* <div className="mt-16">
        <ProductReviews
          productId={product.id}
          reviews={reviewsData.reviews}
          stats={reviewStats}
          canReview={reviewPermission.canReview}
          reviewMessage={reviewPermission.reason}
          hasPurchased={reviewPermission.hasPurchased}
          isAuthenticated={isAuthenticated}
        />
      </div> */}
    </div>
  )
}
