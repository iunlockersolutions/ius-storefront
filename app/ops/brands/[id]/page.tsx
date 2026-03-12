import { EditBrandPageClient } from "@/app/ops/brands/[id]/page-client"

interface BrandDetailsPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Brand Details | Operations",
  description: "Review and update brand details by section",
}

export default async function BrandDetailsPage({
  params,
}: BrandDetailsPageProps) {
  const { id } = await params

  return <EditBrandPageClient brandId={id} />
}
