"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { Loader2 } from "lucide-react"

export default function OpsRouteGuard({
  children,
  mustChangePassword,
}: {
  children: React.ReactNode
  mustChangePassword: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const onPasswordResetPage = pathname.startsWith("/ops/change-password")
  const shouldRedirect = mustChangePassword && !onPasswordResetPage

  useEffect(() => {
    if (!shouldRedirect) {
      return
    }

    router.replace("/ops/change-password")
  }, [router, shouldRedirect])

  if (shouldRedirect) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
