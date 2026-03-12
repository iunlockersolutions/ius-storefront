import { EditCategoryPageClient } from "@/components/admin/categories/edit-category-page-client"

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Category Details | Operations",
  description: "Review and update category details by section",
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params

  return <EditCategoryPageClient categoryId={id} />
}
