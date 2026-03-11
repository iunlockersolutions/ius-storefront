import { redirect } from "next/navigation"

export const metadata = {
  title: "Add Brand | Operations",
  description: "Create a new brand",
}

export default function NewBrandPage() {
  redirect("/ops/catalog-setup?tab=brands&create=brand")
}
