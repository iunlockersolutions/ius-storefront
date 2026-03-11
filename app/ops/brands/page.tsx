import { redirect } from "next/navigation"

export const metadata = {
  title: "Brands | Operations",
  description: "Manage your product brands",
}

export default function BrandsPage() {
  redirect("/ops/catalog-setup?tab=brands")
}
