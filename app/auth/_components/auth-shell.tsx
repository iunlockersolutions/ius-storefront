import Link from "next/link"

import { CheckCircle2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  secondaryTitle: string
  secondaryDescription: string
  secondaryContent: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  highlights?: string[]
  className?: string
}

const defaultHighlights = [
  "Save carts, favorites, and delivery details for your next order.",
  "Track phones, accessories, and electronics purchases in one place.",
  "Use one secure account for checkout, returns, and support.",
]

export function AuthShell({
  eyebrow,
  title,
  description,
  secondaryTitle,
  secondaryDescription,
  secondaryContent,
  children,
  footer,
  highlights = defaultHighlights,
  className,
}: AuthShellProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-10 flex items-center gap-3 sm:mb-14">
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-full pr-4 transition-opacity hover:opacity-80"
        >
          <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-full text-sm font-semibold tracking-[0.24em]">
            I
          </span>
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.28em]">
              IUS Shop
            </p>
            <p className="text-foreground text-lg font-semibold tracking-tight">
              Account access
            </p>
          </div>
        </Link>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
        <section className="max-w-xl">
          <div className="space-y-4">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.32em]">
              {eyebrow}
            </p>
            <h1 className="text-foreground text-pretty text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground max-w-lg text-base leading-7 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="mt-10">{children}</div>

          {footer ? (
            <div className="text-muted-foreground mt-8 text-sm leading-6">
              {footer}
            </div>
          ) : null}
        </section>

        <aside className="border-border relative border-t pt-8 lg:border-t-0 lg:pt-2 lg:pl-12">
          <div className="bg-border absolute inset-y-4 left-0 hidden w-px lg:block" />

          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.28em]">
                Flexible access
              </p>
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                {secondaryTitle}
              </h2>
              <p className="text-muted-foreground text-sm leading-6">
                {secondaryDescription}
              </p>
            </div>

            {secondaryContent}

            <div className="space-y-3 pt-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.28em]">
                Why keep an account
              </p>
              <ul className="space-y-3">
                {highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="text-muted-foreground flex items-start gap-3 text-sm leading-6"
                  >
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function AuthPageSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="mb-10 flex items-center gap-3 sm:mb-14">
        <Skeleton className="size-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-4/5 max-w-sm" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>

        <div className="border-border space-y-4 border-t pt-8 lg:border-t-0 lg:border-l lg:pl-12 lg:pt-0">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}
