import { redirect } from "next/navigation"

export const metadata = {
  title: "New Model | Operations",
  description: "Create a new brand model for the storefront catalog.",
}

export default function NewProductModelGroupPage() {
  redirect("/ops/catalog-setup?tab=models&create=model")
}
