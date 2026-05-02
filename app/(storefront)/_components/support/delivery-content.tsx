import Link from "next/link"

import {
  CheckCircle2,
  Clock,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { routes } from "@/configs/routes"

import { deliveryDetails } from "./support-content"

const highlights = [
  {
    title: "Free islandwide delivery",
    description:
      "We deliver eligible online orders across Sri Lanka without adding a standard delivery charge.",
    icon: Truck,
  },
  {
    title: deliveryDetails.estimate,
    description:
      "Most standard deliveries arrive within the normal islandwide delivery window after order confirmation.",
    icon: Clock,
  },
  {
    title: "Setup help included",
    description:
      "For eligible devices, our team can help with basic setup guidance before handover.",
    icon: Headphones,
  },
  {
    title: "Careful packing",
    description:
      "Orders are packed securely so your device or accessory reaches you in good condition.",
    icon: PackageCheck,
  },
]

const steps = [
  "Place your order online and complete checkout.",
  "Our team confirms stock, payment status, and delivery details.",
  "Your order is packed, handed to the courier, and delivered to your address.",
  "For eligible devices, we can guide you through basic setup or first-use questions.",
]

export function DeliveryContent({
  showOrderPrepPanel = true,
  showReturnsNote = false,
}: {
  showOrderPrepPanel?: boolean
  showReturnsNote?: boolean
}) {
  return (
    <>
      <section className="section-container">
        <div className="grid gap-x-8 gap-y-0 border-b border-zinc-200/70 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.title} className="py-6">
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
          <div
            className={
              showOrderPrepPanel
                ? "grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-start"
                : "w-full"
            }
          >
            <div>
              <p className="text-sm font-medium text-indigo-700">
                How delivery works
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Clear updates from checkout to handover
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
                Our standard islandwide delivery estimate is{" "}
                {deliveryDetails.estimate}. Delivery time may vary depending on
                your location, public holidays, stock availability, payment
                confirmation, and courier conditions.
              </p>

              <div className="mt-8 grid gap-4">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 border-t border-zinc-200/70 pt-4"
                  >
                    <div className="w-6 shrink-0 text-sm font-semibold text-zinc-400">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <p className="pt-1 text-sm leading-6 text-zinc-700">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {showOrderPrepPanel ? (
              <div className="border-t border-zinc-200/70 pt-6 lg:border-t-0 lg:border-l lg:pl-8">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                  <div>
                    <h3 className="text-base font-semibold text-zinc-950">
                      Before we send your order
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">
                      We check the order details, prepare the items for safe
                      transport, and make sure the handover information is
                      clear. If we need to confirm anything, our team will
                      contact you.
                    </p>
                  </div>
                </div>

                {showReturnsNote ? (
                  <div className="mt-6 border-t border-zinc-200/70 pt-6">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-amber-700" />
                      <p className="text-sm leading-6 text-zinc-700">
                        Need help with a return or exchange? Contact our team
                        with your order details. We will guide you based on the
                        product condition, purchase details, and next available
                        support options.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button asChild className="rounded-lg bg-zinc-950 text-white">
                    <Link href={routes.storefront.prodcuts.root}>
                      Shop products
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-lg">
                    <Link href={routes.storefront.support.askAnExpert}>
                      Ask an expert
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}
