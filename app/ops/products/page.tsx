import { ProductsPageClient } from "./_components/products-page-client"

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export const metadata = {
  title: "Products | Ops Dashboard",
  description: "Manage your product catalog in the operations dashboard.",
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || ""

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-neutral-500">Manage your product catalog</p>
        </div>
      </div>

      <ProductsPageClient page={page} search={search} status={status} />
    </div>
  )
}
