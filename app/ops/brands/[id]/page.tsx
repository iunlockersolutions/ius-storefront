import { redirect } from "next/navigation"

interface EditBrandPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Brand | Operations",
  description: "Edit brand details",
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params
  redirect(`/ops/catalog-setup?tab=brands&brand=${id}`)
}
