import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArrowLeft, CheckCircle2, CreditCard, HandCoins } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { routes } from "@/configs/routes"
import { getPublishedInstallmentOfferBySlug } from "@/lib/actions/installment-offer"

interface PageProps {
  params: Promise<{ slug: string }>
}

function paragraphs(value: string | null) {
  return (value ?? "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const offer = await getPublishedInstallmentOfferBySlug(slug)

  if (!offer) {
    return { title: "Installment Plan Not Found" }
  }

  return {
    title: `${offer.title} | EvoluX`,
    description: offer.summary,
  }
}

export default async function InstallmentPlanDetailPage({ params }: PageProps) {
  const { slug } = await params
  const offer = await getPublishedInstallmentOfferBySlug(slug)

  if (!offer) {
    notFound()
  }

  const descriptionParagraphs = paragraphs(offer.description)

  return (
    <>
      <section className="border-b border-zinc-200/70 bg-zinc-50">
        <div className="section-container pt-6 pb-8 sm:pt-8 sm:pb-10">
          <Button asChild variant="ghost" className="mb-6 -ml-2">
            <Link href={routes.storefront.installmentPlans.root}>
              <ArrowLeft className="size-4" />
              All installment plans
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="mx-auto max-w-3xl lg:mx-0">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-700 lg:justify-start">
                <HandCoins className="size-4" />
                <span>{offer.providerName}</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                {offer.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                {offer.summary}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                {offer.terms.map((term) => (
                  <Badge key={`${term.months}-${term.label}`}>
                    {term.months} months
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl lg:mx-0">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {offer.bannerImageUrl ? (
                  <Image
                    src={offer.bannerImageUrl}
                    alt={offer.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                      {offer.logoUrl ? (
                        <Image
                          src={offer.logoUrl}
                          alt={offer.providerName}
                          width={56}
                          height={56}
                          className="max-h-12 w-auto object-contain"
                        />
                      ) : (
                        <CreditCard className="size-8" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-zinc-700">
                      {offer.providerName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-container">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-start">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <p className="text-sm font-medium text-indigo-700">
                Offer details
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Review the plan before you buy
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-600 sm:text-base">
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))
                ) : (
                  <p>{offer.summary}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {offer.terms.map((term) => (
                <div
                  key={`${term.months}-${term.label}-${term.minimumAmount}`}
                  className="rounded-lg border border-zinc-200 p-5"
                >
                  <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-950">
                        {term.months} months at 0%
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">{term.label}</p>
                      {term.minimumAmount ? (
                        <p className="mt-2 text-sm font-medium text-zinc-800">
                          Minimum amount: {term.minimumAmount}
                        </p>
                      ) : null}
                      {term.notes ? (
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          {term.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {offer.termsAndConditions.length > 0 ? (
        <section className="border-y border-zinc-200/70 bg-zinc-50">
          <div className="section-container">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm font-medium text-indigo-700">
                Terms and conditions
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Important notes
              </h2>
              <div className="mt-6 grid gap-3">
                {offer.termsAndConditions.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg bg-white p-4 text-left"
                  >
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                    <p className="text-sm leading-6 text-zinc-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="section-container">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-indigo-700">
              Ready to shop?
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Choose your device and ask our team about this plan.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              Availability can depend on the selected product, card issuer, and
              bank approval. Our team can help confirm current options.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="rounded-lg bg-zinc-950 text-white">
                <Link href={routes.storefront.prodcuts.root}>
                  Shop products
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-lg">
                <Link href={routes.storefront.support.contact}>
                  Contact support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
