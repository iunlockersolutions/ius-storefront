import Link from "next/link"

import { Plus } from "lucide-react"

import { ProductsTable } from "@/components/admin/products/products-table"
import { Button } from "@/components/ui/button"
import { getProducts } from "@/lib/actions/product"

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || ""

  const { products, total, totalPages } = await getProducts({
    page,
    search,
    status,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-neutral-500">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductsTable
        products={products}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
      />
    </div>
  )
}
