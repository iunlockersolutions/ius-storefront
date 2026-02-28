import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminQueryLoadingStateProps {
  wrapperClassName?: string
  skeletonClassName?: string
}

interface AdminQueryErrorStateProps {
  message: string
  onRetry?: () => void | Promise<unknown>
  retryLabel?: string
  backHref?: string
  backLabel?: string
}

interface AdminQueryEmptyStateProps {
  message: string
  backHref?: string
  backLabel?: string
}

export function getQueryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function AdminQueryLoadingState({
  wrapperClassName = "space-y-4",
  skeletonClassName = "h-96 w-full",
}: AdminQueryLoadingStateProps) {
  return (
    <div className={wrapperClassName}>
      <Skeleton className={skeletonClassName} />
    </div>
  )
}

export function AdminQueryErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
  backHref,
  backLabel,
}: AdminQueryErrorStateProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {message}
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <Button variant="outline" onClick={() => void onRetry()}>
            {retryLabel}
          </Button>
        ) : null}
        {backHref && backLabel ? (
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function AdminQueryEmptyState({
  message,
  backHref,
  backLabel,
}: AdminQueryEmptyStateProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
        {message}
      </div>
      {backHref && backLabel ? (
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
