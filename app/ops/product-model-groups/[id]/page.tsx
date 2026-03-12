import { EditProductModelGroupPageClient } from "@/app/ops/product-model-groups/[id]/page-client"

interface ProductModelGroupPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Model Details | Operations",
  description: "Review and update model details by section.",
}

export default async function ProductModelGroupDetailsPage({
  params,
}: ProductModelGroupPageProps) {
  const { id } = await params

  return <EditProductModelGroupPageClient modelId={id} />
}
