import Image from "next/image"
import Link from "next/link"

import { ChevronRight, FolderOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveCategories } from "@/lib/actions/category"

export const metadata = {
  title: "Categories | IUS Shop",
  description: "Browse our product categories",
}

type CategoryWithChildren = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  children: CategoryWithChildren[]
}

function CategoryCard({ category }: { category: CategoryWithChildren }) {
  const hasChildren = category.children.length > 0

  return (
    <Link href={`/categories/${category.slug}`}>
      <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
        {category.image ? (
          <div className="relative aspect-3/2 w-full overflow-hidden rounded-t-lg">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <h3 className="absolute bottom-3 left-3 right-3 text-lg font-semibold text-white">
              {category.name}
            </h3>
          </div>
        ) : (
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {category.name}
              </CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent className={category.image ? "pt-4" : "pt-0"}>
          {category.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {category.description}
            </p>
          )}
          {hasChildren && (
            <div className="flex flex-wrap gap-1.5">
              {category.children.slice(0, 3).map((child) => (
                <Badge key={child.id} variant="secondary" className="text-xs">
                  {child.name}
                </Badge>
              ))}
              {category.children.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{category.children.length - 3} more
                </Badge>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center text-sm text-primary font-medium">
            Browse Products
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function CategoriesPage() {
  const categories = await getActiveCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our collection of products by category
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-medium">No categories yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon for our product categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category as CategoryWithChildren}
            />
          ))}
        </div>
      )}

      {/* Featured Subcategories */}
      {categories.some((c) => c.children.length > 0) && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Subcategory</h2>
          <div className="space-y-8">
            {categories
              .filter((c) => c.children.length > 0)
              .map((category) => (
                <div key={category.id}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <span className="text-sm font-medium truncate">
                          {child.name}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
