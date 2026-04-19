"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { routes } from "@/configs/routes"
import { clearAuthCookies } from "@/lib/actions/admin-auth"
import { authClient } from "@/lib/auth-client"

export function useStorefrontSignOut() {
  const router = useRouter()

  return React.useCallback(async () => {
    await clearAuthCookies()
    await authClient.signOut()
    router.push(routes.storefront.root)
    router.refresh()
  }, [router])
}
