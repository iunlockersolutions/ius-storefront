import { passkeyClient } from "@better-auth/passkey/client"
import { adminClient, twoFactorClient } from "better-auth/client/plugins"
import type { Role as BetterAuthRole } from "better-auth/plugins/access"
import { createAuthClient } from "better-auth/react"

import { ac, roles } from "@/lib/auth/permissions"

const authClientBaseURL = process.env.NEXT_PUBLIC_SITE_URL?.trim()
const adminClientRoles = roles as Record<string, BetterAuthRole>

function redirectToTwoFactor() {
  if (typeof window === "undefined") {
    return
  }

  const target = new URL("/auth/two-factor", window.location.origin)
  const current = new URL(window.location.href)
  const callbackUrl = current.searchParams.get("callbackUrl")

  if (callbackUrl) {
    target.searchParams.set("callbackUrl", callbackUrl)
  }

  window.location.href = target.toString()
}

export const authClient = createAuthClient({
  ...(authClientBaseURL ? { baseURL: authClientBaseURL } : {}),
  plugins: [
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect: redirectToTwoFactor,
    }),
    adminClient({
      ac,
      roles: adminClientRoles,
    }),
  ],
})
