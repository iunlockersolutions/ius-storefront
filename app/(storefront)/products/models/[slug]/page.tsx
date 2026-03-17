import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronRight, Package } from "lucide-react"

import { ProductCard } from "@/app/(storefront)/_components/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getModelBySlug } from "@/lib/actions/model"
import { getStorefrontProducts } from "@/lib/actions/product"

interface ProductModelPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductModelPageProps) {
  const { slug } = await params
  const model = await getModelBySlug(slug)

  if (!model) {
    return {
      title: "Model Not Found | IUS Shop",
    }
  }

  return {
    title: `${model.name} | IUS Shop`,
    description:
      model.description ||
      `Browse all listings for ${model.name} from ${model.brandName}.`,
  }
}

export default async function ProductModelPage({
  params,
}: ProductModelPageProps) {
  const { slug } = await params
  const model = await getModelBySlug(slug)

  if (!model) {
    notFound()
  }

  const { products, total } = await getStorefrontProducts({
    modelSlug: slug,
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
          href={`/products?category=${model.primaryCategorySlug}`}
          className="hover:text-foreground"
        >
          {model.primaryCategoryName}
        </Link>
        <ChevronRight className="size-4" />
        <Link
          href={`/products?category=${model.primaryCategorySlug}&brand=${model.brandSlug}`}
          className="hover:text-foreground"
        >
          {model.brandName}
        </Link>
        <ChevronRight className="size-4" />
        <span className="max-w-60 truncate font-medium text-foreground">
          {model.name}
        </span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{model.primaryCategoryName}</Badge>
            <Badge variant="outline">{model.brandName}</Badge>
            <Badge>{total} listings</Badge>
          </div>
          <h1 className="truncate text-3xl font-bold tracking-tight">
            {model.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {model.description ||
              `All active listings currently assigned to the ${model.name} model.`}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link
            href={`/products?category=${model.primaryCategorySlug}&brand=${model.brandSlug}`}
          >
            View all {model.brandName}
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border py-16 text-center">
          <Package className="mx-auto size-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">No listings found</h2>
          <p className="mt-2 text-muted-foreground">
            There are no active products assigned to this model yet.
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
