import Link from "next/link"

import { Info, Mail, MapPin, Phone } from "lucide-react"

import { WhatsApp } from "@/components/icons/svg/whatsapp"
import { Button } from "@/components/ui/button"

import { buildWhatsAppHref, supportContact } from "./support-content"

const whatsappHref = buildWhatsAppHref(
  "Hello EvoluX, I need help with a product or order.",
)

const methods = [
  {
    title: "Email",
    description: "Send product questions, order details, or support notes.",
    value: supportContact.email,
    href: `mailto:${supportContact.email}`,
    icon: Mail,
  },
  {
    title: "Phone",
    description: "Speak to our team during normal store hours.",
    value: supportContact.phone,
    href: supportContact.phoneHref,
    icon: Phone,
  },
  {
    title: "Store",
    description: "Placeholder address for customer visits and pickups.",
    value: supportContact.address,
    href: "https://maps.google.com/?q=Matara%2C%20Sri%20Lanka",
    icon: MapPin,
  },
]

export function ContactMethods() {
  return (
    <div className="space-y-6">
      <Button
        asChild
        size="lg"
        className="h-12 w-full rounded-lg bg-[#25D366] text-white hover:bg-[#1fb85a]"
      >
        <Link href={whatsappHref} target="_blank" rel="noreferrer">
          <WhatsApp className="size-5" />
          Chat on WhatsApp
        </Link>
      </Button>

      <div className="divide-y divide-zinc-200/70 border-y border-zinc-200/70">
        {methods.map((method) => (
          <Link
            key={method.title}
            href={method.href}
            target={method.title === "Store" ? "_blank" : undefined}
            rel={method.title === "Store" ? "noreferrer" : undefined}
            className="group block py-5"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0 text-zinc-500 transition group-hover:text-indigo-700">
                <method.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">
                  {method.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {method.description}
                </p>
                <p className="mt-2 text-sm font-medium text-indigo-700 group-hover:text-indigo-600">
                  {method.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3 border-t border-zinc-200/70 pt-5">
        <Info className="mt-0.5 size-4 shrink-0 text-zinc-400" />
        <p className="text-sm leading-6 text-zinc-500">
          These are example contact details for now. Replace them later with the
          official EvoluX email, phone number, WhatsApp number, and store
          address.
        </p>
      </div>
    </div>
  )
}
