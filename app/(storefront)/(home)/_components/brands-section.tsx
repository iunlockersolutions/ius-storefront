import Image from "next/image"
import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { ManagedMediaImage } from "@/components/shared/media/managed-media-image"
import { Button } from "@/components/ui/button"

interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  productCount: number
}

interface BrandsSectionProps {
  brands: Brand[]
}

export function BrandsSection({ brands }: BrandsSectionProps) {
  if (brands.length === 0) return null

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 sm:text-sm">
            Our Partners
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
            Shop by Brand
          </h2>
        </div>

        {/* Brand grid — scrollable row on mobile, grid on larger */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group flex w-32 shrink-0 flex-col items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-5 transition-all hover:border-zinc-200 hover:shadow-sm sm:w-auto"
            >
              {/* Logo */}
              <div className="relative flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
                {brand.logo ? (
                  <ManagedMediaImage
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain transition-transform group-hover:scale-105"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-400">
                    {brand.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name + count */}
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
                  {brand.name}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {brand.productCount}{" "}
                  {brand.productCount === 1 ? "product" : "products"}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* View all — full-width on mobile */}
        <div className="mt-6 text-center sm:mt-8">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full rounded-full sm:w-auto"
          >
            <Link href="/brands">
              View All Brands
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
