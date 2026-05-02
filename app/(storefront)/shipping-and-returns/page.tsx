import Link from "next/link"

import {
  Bell,
  CheckCircle2,
  Clock,
  type LucideIcon,
  MapPin,
  MessageCircle,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { routes } from "@/configs/routes"

import {
  buildWhatsAppHref,
  deliveryDetails,
  supportContact,
} from "../_components/support/support-content"
import { SupportHero } from "../_components/support/support-hero"

export const metadata = {
  title: "Shipping & Returns | EvoluX",
  description:
    "Islandwide delivery information and simple return or exchange guidance for EvoluX customers.",
}

type SupportItem = {
  title: string
  description: string
  icon: LucideIcon
}

const shippingHighlights: SupportItem[] = [
  {
    title: deliveryDetails.coverage,
    description:
      "We deliver online orders across Sri Lanka using the delivery details you provide at checkout.",
    icon: MapPin,
  },
  {
    title: deliveryDetails.estimate,
    description:
      "Most orders arrive within the normal delivery window after stock and payment are confirmed.",
    icon: Clock,
  },
  {
    title: "Order updates",
    description:
      "If we need to confirm an address, payment, item, or handover detail, our team will contact you.",
    icon: Bell,
  },
  {
    title: "Secure handover",
    description:
      "Orders are packed for safe transport and handed over using the recipient details on the order.",
    icon: Truck,
  },
]

const deliverySteps = [
  {
    title: "Order confirmation",
    description:
      "After checkout, we review stock, payment status, recipient details, and any delivery notes.",
  },
  {
    title: "Packing and dispatch",
    description:
      "Your order is prepared for delivery and passed to the delivery team or courier partner.",
  },
  {
    title: "Delivery attempt",
    description:
      "The recipient may be contacted for directions, availability, or handover confirmation.",
  },
]

const returnGuidelines: SupportItem[] = [
  {
    title: "Start with your order details",
    description:
      "Contact us with your order number, item name, contact number, and a short note about the issue.",
    icon: MessageCircle,
  },
  {
    title: "Keep the item complete",
    description:
      "Please keep the product, box, accessories, manuals, invoice, and any warranty documents together.",
    icon: PackageOpen,
  },
  {
    title: "Condition is reviewed",
    description:
      "Return or exchange options depend on the product condition, purchase details, and support policy.",
    icon: ShieldCheck,
  },
  {
    title: "We guide the next step",
    description:
      "Our team will explain whether the next step is inspection, replacement, exchange, or another support option.",
    icon: CheckCircle2,
  },
]

export default function ShippingAndReturnsPage() {
  return (
    <>
      <SupportHero
        eyebrow="Shipping and returns"
        title="Delivery timelines and return help, all in one place."
        description="Find the essentials for islandwide delivery, order handover, and what to do if an item arrives damaged, incorrect, or not as expected."
        icon={RefreshCw}
        primaryCta={{
          label: "Contact support",
          href: routes.storefront.support.contact,
        }}
        secondaryCta={{
          label: "Shop products",
          href: routes.storefront.prodcuts.root,
        }}
      />

      <section className="section-container">
        <div className="grid gap-x-8 gap-y-0 border-b border-zinc-200/70 md:grid-cols-2 lg:grid-cols-4">
          {shippingHighlights.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center py-6 text-center lg:items-start lg:text-left"
            >
              <div className="mb-4 text-indigo-700">
                <item.icon className="size-5" />
              </div>
              <h2 className="text-base font-semibold text-zinc-950">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-container">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-start">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <p className="text-sm font-medium text-indigo-700">
                Shipping details
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                What happens after checkout
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
                Our standard delivery estimate is {deliveryDetails.estimate}.
                Delivery timing may change because of location, public holidays,
                stock availability, payment confirmation, courier capacity, or
                weather conditions.
              </p>
            </div>

            <div className="grid gap-4">
              {deliverySteps.map((step, index) => (
                <div
                  key={step.title}
                  className="grid gap-3 border-t border-zinc-200/70 pt-4 sm:grid-cols-[3rem_1fr]"
                >
                  <div className="text-sm font-semibold text-zinc-400">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200/70 bg-zinc-50">
        <div className="section-container">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-indigo-700">
              Returns and exchanges
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              If something is not right, tell us early
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              Return and exchange requests are reviewed case by case. The
              fastest way to get help is to contact our team with your order
              details, photos if relevant, and a clear description of what
              happened.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {returnGuidelines.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-zinc-200 bg-white p-5"
              >
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 lg:mx-0">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="section-container">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-indigo-700">
              Need delivery or return help?
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Send us the order details and we will guide you
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              Include your order number, phone number, item name, and photos if
              the item arrived damaged or incorrect. You can contact us through
              the support page, WhatsApp, or email at {supportContact.email}.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="h-11 rounded-lg bg-zinc-950 px-4 text-white hover:bg-zinc-800"
              >
                <Link href={routes.storefront.support.contact}>
                  Contact support
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-lg border-zinc-300 bg-white px-4 text-zinc-950 hover:bg-zinc-100"
              >
                <Link
                  href={buildWhatsAppHref(
                    "Hi EvoluX, I need help with shipping or returns for my order.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Message on WhatsApp
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
