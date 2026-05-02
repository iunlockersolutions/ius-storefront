import Link from "next/link"

import { ArrowRight, CreditCard, Package, Store } from "lucide-react"

import { routes } from "@/configs/routes"

const features = [
  {
    icon: CreditCard,
    title: "Ways to Pay",
    description:
      "From paying in full to choosing a plan — you choose the payment method that's best for you.",
    link: "/products",
    linkText: "Learn more",
  },
  {
    icon: Package,
    title: "Delivery",
    description:
      "FREE and fast delivery methods so you don't have to wait. Island-wide coverage.",
    link: routes.storefront.support.freeSetupAndDelivery,
    linkText: "Learn more",
  },
  {
    icon: Store,
    title: "Collections",
    description:
      "Free pickup in under 1 hour. Order your favourite products online and collect from any of our locations.",
    link: "/products",
    linkText: "Learn more",
  },
]

export function StoreInfoSection() {
  return (
    <section className="section-container">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-12">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 sm:h-14 sm:w-14">
              <feature.icon className="h-6 w-6 text-zinc-400 sm:h-7 sm:w-7" />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-zinc-900 sm:text-lg">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
              {feature.description}
            </p>

            {/* Link */}
            <Link
              href={feature.link}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {feature.linkText}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
