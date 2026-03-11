import { redirect } from "next/navigation"

export const metadata = {
  title: "Models | Operations",
  description: "Manage product models used by the storefront catalog.",
}

export default function ProductModelGroupsPage() {
  redirect("/ops/catalog-setup?tab=models")
}
