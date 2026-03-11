import { redirect } from "next/navigation"

interface ProductModelGroupPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Model | Operations",
  description: "Update model details.",
}

export default async function EditProductModelGroupPage({
  params,
}: ProductModelGroupPageProps) {
  const { id } = await params
  redirect(`/ops/catalog-setup?tab=models&model=${id}`)
}
