import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"

import { ac, roles } from "@/lib/auth/permissions"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/send"

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
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      prompt: "select_account",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  plugins: [
    // Passkey plugin for WebAuthn support
    passkey({
      rpID: process.env.PASSKEY_RP_ID || "localhost",
      rpName: process.env.PASSKEY_RP_NAME || "IUS Shop",
      origin: process.env.SITE_URL || "http://localhost:3000",
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
  trustedOrigins: [process.env.SITE_URL || "http://localhost:3000"],
})

// Export auth types
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
