import {
  Children,
  type ComponentType,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface AuthContainerProps {
  title: string
  description: string
  children: ReactNode
  className?: string
}

interface AuthContainerContentProps {
  children: ReactNode
  className?: string
}

interface AuthContainerFooterProps {
  children: ReactNode
  className?: string
}

interface AuthContainerSecondaryContentProps {
  title: string
  description: ReactNode
  eyebrow?: string
  children: ReactNode
  className?: string
}

interface AuthContainerSlots {
  content: AuthContainerContentProps | null
  footer: AuthContainerFooterProps | null
  secondary: AuthContainerSecondaryContentProps | null
  unassignedChildren: ReactNode[]
}

export function AuthContainerContent(_: AuthContainerContentProps) {
  return null
}

export function AuthContainerFooter(_: AuthContainerFooterProps) {
  return null
}

export function AuthContainerSecondaryContent(
  _: AuthContainerSecondaryContentProps,
) {
  return null
}

function isSlotComponent<Props>(
  child: ReactNode,
  component: ComponentType<Props>,
): child is ReactElement<Props> {
  return isValidElement(child) && child.type === component
}

function AuthContainerRoot({
  title,
  description,
  children,
  className,
}: AuthContainerProps) {
  const { content, footer, secondary, unassignedChildren } = Children.toArray(
    children,
  ).reduce<AuthContainerSlots>(
    (slots, child) => {
      if (isSlotComponent(child, AuthContainerContent)) {
        slots.content = child.props
        return slots
      }

      if (isSlotComponent(child, AuthContainerFooter)) {
        slots.footer = child.props
        return slots
      }

      if (isSlotComponent(child, AuthContainerSecondaryContent)) {
        slots.secondary = child.props
        return slots
      }

      slots.unassignedChildren.push(child)
      return slots
    },
    {
      content: null,
      footer: null,
      secondary: null,
      unassignedChildren: [],
    },
  )

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "grid gap-12 lg:gap-16",
          secondary ? "lg:grid-cols-2" : undefined,
        )}
      >
        <section className="max-w-xl">
          <div className="space-y-4">
            <h1 className="text-foreground text-pretty text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground max-w-lg text-base leading-7 sm:text-lg">
              {description}
            </p>
          </div>

          <div className={cn("mt-10", content?.className)}>
            {content?.children ?? unassignedChildren}
          </div>
        </section>

        {secondary ? (
          <aside
            className={cn(
              "border-border relative border-t pt-8 lg:border-t-0 lg:pt-2 lg:pl-12",
              secondary.className,
            )}
          >
            <div className="bg-border absolute inset-y-4 left-0 hidden w-px lg:block" />

            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.28em]">
                  {secondary.eyebrow ?? "Flexible access"}
                </p>
                <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                  {secondary.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-6">
                  {secondary.description}
                </p>
              </div>
              {secondary.children}
            </div>
          </aside>
        ) : null}
      </div>
      {footer ? (
        <div
          className={cn(
            "text-muted-foreground mt-8 text-sm leading-6 flex items-center justify-center",
            footer.className,
          )}
        >
          {footer.children}
        </div>
      ) : null}
    </div>
  )
}

export const AuthContainer = AuthContainerRoot

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
