import { notFound } from "next/navigation"

import { ProductReceiveStockPageClient } from "@/app/ops/inventory/_components/product-receive-stock-page-client"
import { getProductReceiveStockContext } from "@/lib/actions/inventory"

interface ProductReceiveStockPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Receive Stock | Ops Dashboard",
  description: "Receive inventory for an existing product.",
}

export default async function ProductReceiveStockPage({
  params,
}: ProductReceiveStockPageProps) {
  const { id } = await params

  try {
    const context = await getProductReceiveStockContext(id)

    if (context.variants.length === 0) {
      notFound()
    }
  } catch {
    notFound()
  }

  return <ProductReceiveStockPageClient productId={id} />
}
