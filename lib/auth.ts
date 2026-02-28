import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"

import { ac, roles } from "@/lib/auth/permissions"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/send"
import { serverEnv } from "@/lib/env"

import { passkeyPlugin, trustedOrigins } from "./passkey"

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
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
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
    passkeyPlugin,
    admin({
      ac,
      roles: roles as any,
      defaultRole: "customer",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7d
    updateAge: 60 * 60 * 24, // 1d
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5min
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

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
