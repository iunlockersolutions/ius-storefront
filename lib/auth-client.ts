import { passkeyClient } from "@better-auth/passkey/client"
import { adminClient } from "better-auth/client/plugins"
import type { Role as BetterAuthRole } from "better-auth/plugins/access"
import { createAuthClient } from "better-auth/react"

import { ac, roles } from "@/lib/auth/permissions"

/**
 * BetterAuth Client
 *
 * Client-side authentication utilities for use in React components.
 * Includes passkey and admin client plugins.
 */
const authClientBaseURL = process.env.NEXT_PUBLIC_SITE_URL?.trim()
const adminClientRoles = roles as Record<string, BetterAuthRole>

export const authClient = createAuthClient({
  ...(authClientBaseURL ? { baseURL: authClientBaseURL } : {}),
  plugins: [
    passkeyClient(),

    adminClient({
      ac,
      roles: adminClientRoles,
    }),
  ],
})

// Export commonly used hooks and utilities
export const { signIn, signUp, signOut, useSession, getSession } = authClient
