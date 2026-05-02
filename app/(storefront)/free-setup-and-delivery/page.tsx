import { PackageCheck } from "lucide-react"

import { routes } from "@/configs/routes"

import { DeliveryContent } from "../_components/support/delivery-content"
import { SupportHero } from "../_components/support/support-hero"

export const metadata = {
  title: "Free Setup & Delivery | EvoluX",
  description:
    "Free islandwide delivery, normal 3 to 5 working day delivery, and setup help for eligible EvoluX orders.",
}

export default function FreeSetupAndDeliveryPage() {
  return (
    <>
      <SupportHero
        eyebrow="Free setup and delivery"
        title="We deliver your order carefully and help you get started."
        description="Enjoy free islandwide delivery on eligible online orders, with normal delivery taking 3 to 5 working days. For eligible devices, our team can also help with basic setup guidance and first-use questions."
        icon={PackageCheck}
        primaryCta={{
          label: "Shop products",
          href: routes.storefront.prodcuts.root,
        }}
        secondaryCta={{
          label: "Ask an expert",
          href: routes.storefront.support.askAnExpert,
        }}
      />
      <DeliveryContent showOrderPrepPanel={false} />
    </>
  )
}
