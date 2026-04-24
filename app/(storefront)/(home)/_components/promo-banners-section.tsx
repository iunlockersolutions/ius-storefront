import Image from "next/image"
import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface PromoBannerProps {
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  image: string
  imageAlt: string
  /** Accent background color for the text side */
  bg?: string
  /** Flip layout — image left, text right */
  reverse?: boolean
}

/* ------------------------------------------------------------------ */
/*  Single full-width promo banner                                    */
/* ------------------------------------------------------------------ */

export function PromoBanner({
  title,
  subtitle,
  ctaText,
  ctaLink,
  image,
  imageAlt,
  bg = "bg-blue-50",
  reverse = false,
}: PromoBannerProps) {
  return (
    <section className={`${bg} overflow-hidden`}>
      <div className="mx-auto max-w-7xl">
        <div
          className={`grid min-h-52 grid-cols-1 sm:min-h-64 sm:grid-cols-2 lg:min-h-72 ${
            reverse ? "sm:direction-rtl" : ""
          }`}
        >
          {/* Text side */}
          <div
            className={`flex flex-col justify-center px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16 ${
              reverse ? "sm:order-2 sm:direction-ltr" : ""
            }`}
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-600 sm:text-base">
              {subtitle}
            </p>
            <div className="mt-6">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-zinc-900 font-medium text-white hover:bg-zinc-800"
              >
                <Link href={ctaLink}>
                  {ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Image side — full vivid, no overlay */}
          <div
            className={`relative min-h-48 sm:min-h-0 ${
              reverse ? "sm:order-1 sm:direction-ltr" : ""
            }`}
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Pre-configured banners for homepage use                           */
/* ------------------------------------------------------------------ */

export function PromoTradeIn() {
  return (
    <PromoBanner
      title="Trade In & Save"
      subtitle="Get credit towards your new purchase when you trade in an eligible device. It's easy and good for the planet."
      ctaText="Learn More"
      ctaLink="/products"
      image="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1000&q=80&auto=format&fit=crop"
      imageAlt="Trade in your device"
      bg="bg-sky-50"
    />
  )
}

export function PromoFreeDelivery() {
  return (
    <PromoBanner
      title="Free Island-Wide Delivery"
      subtitle="Enjoy free delivery on all orders over LKR 25,000. Fast, reliable and tracked to your door."
      ctaText="Shop Now"
      ctaLink="/products"
      image="https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1000&q=80&auto=format&fit=crop"
      imageAlt="Free delivery on orders"
      bg="bg-emerald-50"
      reverse
    />
  )
}
