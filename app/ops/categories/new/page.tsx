import { redirect } from "next/navigation"

export const metadata = {
  title: "Add New Category | Operations",
  description: "Add a new product category",
}

export default function NewCategoryPage() {
  redirect("/ops/categories?create=1")
}
