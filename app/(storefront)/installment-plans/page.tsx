import Image from "next/image"
import Link from "next/link"

import { ArrowRight, CreditCard, HandCoins } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { routes } from "@/configs/routes"
import { getPublishedInstallmentOffers } from "@/lib/actions/installment-offer"

export const metadata = {
  title: "0% Installment Plans | EvoluX",
  description:
    "Browse current 0% installment plan notices from banks and card services available through EvoluX.",
}

export const revalidate = 1800

export default async function InstallmentPlansPage() {
  const offers = await getPublishedInstallmentOffers()

  return (
    <>
      <section className="border-b border-zinc-200/70 bg-zinc-50">
        <div className="section-container pt-10 pb-8 sm:pt-12 sm:pb-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-700 lg:justify-start">
              <HandCoins className="size-4" />
              <span>0% installment plans</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Bank and card offers you can review before checkout.
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Browse currently published 0% installment notices, eligible card
              or service labels, and the key terms shared by our team.
            </p>
          </div>
        </div>
      </section>

      <section className="section-container">
        {offers.length === 0 ? (
          <div className="mx-auto max-w-xl py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <CreditCard className="size-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-zinc-950">
              No active installment plans
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Published 0% installment notices will appear here when they are
              available.
            </p>
            <Button asChild className="mt-6 rounded-lg bg-zinc-950 text-white">
              <Link href={routes.storefront.prodcuts.root}>Shop products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <Link
                key={offer.id}
                href={routes.storefront.installmentPlans.id(offer.slug)}
                className="group block"
              >
                <Card className="h-full rounded-lg transition hover:shadow-md">
                  {offer.bannerImageUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                      <Image
                        src={offer.bannerImageUrl}
                        alt={offer.title}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    </div>
                  ) : null}
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:text-left">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                        {offer.logoUrl ? (
                          <Image
                            src={offer.logoUrl}
                            alt={offer.providerName}
                            width={48}
                            height={48}
                            className="max-h-10 w-auto object-contain"
                          />
                        ) : (
                          <CreditCard className="size-6 text-indigo-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-indigo-700">
                          {offer.providerName}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                          {offer.title}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">
                      {offer.summary}
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                      {offer.terms.slice(0, 3).map((term) => (
                        <Badge key={`${offer.id}-${term.months}-${term.label}`}>
                          {term.months} months
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-center text-sm font-medium text-indigo-700 lg:justify-start">
                      {offer.readMoreLabel}
                      <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
