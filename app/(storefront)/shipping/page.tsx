import { redirect } from "next/navigation"

import { routes } from "@/configs/routes"

export default function ShippingRedirectPage() {
  redirect(routes.storefront.support.shippingAndReturns)
}
