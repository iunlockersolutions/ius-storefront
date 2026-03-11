import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronRight, Package } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStorefrontProducts } from "@/lib/actions/product"
import { getProductModelGroupBySlug } from "@/lib/actions/product-model-group"

interface ProductModelGroupPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductModelGroupPageProps) {
  const { slug } = await params
  const group = await getProductModelGroupBySlug(slug)

  if (!group) {
    return {
      title: "Model Not Found | IUS Shop",
    }
  }

  return {
    title: `${group.name} | IUS Shop`,
    description:
      group.description ||
      `Browse all listings for ${group.name} from ${group.brandName}.`,
  }
}

export default async function ProductModelGroupPage({
  params,
}: ProductModelGroupPageProps) {
  const { slug } = await params
  const group = await getProductModelGroupBySlug(slug)

  if (!group) {
    notFound()
  }

  const { products, total } = await getStorefrontProducts({
    productModelGroupSlug: slug,
    sortBy: "newest",
    limit: 100,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <ChevronRight className="size-4" />
        <Link
          href={`/products?category=${group.categorySlug}`}
          className="hover:text-foreground"
        >
          {group.categoryName}
        </Link>
        <ChevronRight className="size-4" />
        <Link
          href={`/products?category=${group.categorySlug}&brand=${group.brandSlug}`}
          className="hover:text-foreground"
        >
          {group.brandName}
        </Link>
        <ChevronRight className="size-4" />
        <span className="max-w-60 truncate font-medium text-foreground">
          {group.name}
        </span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{group.categoryName}</Badge>
            <Badge variant="outline">{group.brandName}</Badge>
            <Badge>{total} listings</Badge>
          </div>
          <h1 className="truncate text-3xl font-bold tracking-tight">
            {group.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {group.description ||
              `All active listings currently assigned to the ${group.name} model group.`}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link
            href={`/products?category=${group.categorySlug}&brand=${group.brandSlug}`}
          >
            View all {group.brandName}
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border py-16 text-center">
          <Package className="mx-auto size-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">No listings found</h2>
          <p className="mt-2 text-muted-foreground">
            There are no active products assigned to this model group yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
