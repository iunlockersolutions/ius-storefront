import Link from "next/link"

import { ArrowRight, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface SupportHeroProps {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  primaryCta?: {
    label: string
    href: string
  }
  secondaryCta?: {
    label: string
    href: string
  }
}

export function SupportHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  primaryCta,
  secondaryCta,
}: SupportHeroProps) {
  return (
    <section>
      <div className="section-container border-b border-zinc-200/70 pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
            <Icon className="size-4" />
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            {description}
          </p>

          {(primaryCta || secondaryCta) && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {primaryCta ? (
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800"
                >
                  <Link href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-lg border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-100"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
