import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"

import { ac, roles } from "@/lib/auth/permissions"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/send"
import { serverEnv } from "@/lib/env"

const DEFAULT_LOCAL_ORIGIN = "http://localhost:4000"
const DEFAULT_PASSKEY_RP_NAME = "IUS Shop"

function normalizeOrigin(value: string): string {
  const url = new URL(value)
  return url.origin
}

function parseOriginList(value?: string): string[] {
  if (!value) return []

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function resolvePasskeyOrigins() {
  const configuredOrigins = parseOriginList(serverEnv.PASSKEY_ORIGIN)

  if (configuredOrigins.length > 0) {
    return configuredOrigins
  }

  const fallbackOrigins = [
    serverEnv.SITE_URL,
    serverEnv.NEXT_PUBLIC_SITE_URL,
    serverEnv.BETTER_AUTH_URL,
    DEFAULT_LOCAL_ORIGIN,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeOrigin)

  return unique(fallbackOrigins)
}

function resolvePasskeyRpId(passkeyOrigins: string[]) {
  if (serverEnv.PASSKEY_RP_ID?.trim()) {
    return serverEnv.PASSKEY_RP_ID.trim()
  }

  return new URL(passkeyOrigins[0]).hostname
}

const passkeyOrigins = resolvePasskeyOrigins()
const trustedOrigins = unique(
  [
    ...passkeyOrigins,
    serverEnv.SITE_URL,
    serverEnv.NEXT_PUBLIC_SITE_URL,
    serverEnv.BETTER_AUTH_URL,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeOrigin),
)
const passkeyOrigin =
  passkeyOrigins.length === 1 ? passkeyOrigins[0] : passkeyOrigins

/**
 * BetterAuth Configuration
 *
 * Handles all authentication for the platform:
 * - Email/password authentication
 * - Social OAuth (Google, GitHub) for customers
 * - Passkey authentication (WebAuthn)
 * - Admin plugin for user management
 * - Session management
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      passkey: schema.passkey,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    sendResetPassword: async ({ user, url }) => {
      // Send password reset email
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        template: "password-reset",
        data: {
          name: user.name,
          url,
        },
      })
    },
  },
  socialProviders: {
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID || "",
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET || "",
      prompt: "select_account",
    },
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID || "",
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET || "",
    },
  },
  plugins: [
    // Passkey plugin for WebAuthn support
    passkey({
      rpID: resolvePasskeyRpId(passkeyOrigins),
      rpName: serverEnv.PASSKEY_RP_NAME || DEFAULT_PASSKEY_RP_NAME,
      origin: passkeyOrigin,
    }),
    // Admin plugin for user management

    admin({
      ac,
      roles: roles as any,
      defaultRole: "customer",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      invitedBy: {
        type: "string",
        required: false,
      },
      invitedAt: {
        type: "date",
        required: false,
      },
      lastPasswordChange: {
        type: "date",
        required: false,
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  trustedOrigins,
})

// Export auth types
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
