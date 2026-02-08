import { passkeyClient } from "@better-auth/passkey/client"
import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { ac, roles } from "@/lib/auth/permissions"

/**
 * BetterAuth Client
 *
 * Client-side authentication utilities for use in React components.
 * Includes passkey and admin client plugins.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  plugins: [
    passkeyClient(),

    adminClient({
      ac,
      roles: roles as any,
    }),
  ],
})

// Export commonly used hooks and utilities
export const { signIn, signUp, signOut, useSession, getSession } = authClient
