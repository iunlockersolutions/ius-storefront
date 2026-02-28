import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins"

import { ac, roles } from "@/lib/auth/permissions"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/send"
import { serverEnv } from "@/lib/env"

const appBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000"

export const auth = betterAuth({
  appName: "IUS Storefront",
  baseURL: appBaseUrl,
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
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
  plugins: [
    passkey({
      rpID: serverEnv.PASSKEY_RP_ID,
      rpName: serverEnv.PASSKEY_RP_NAME,
      origin: serverEnv.PASSKEY_ORIGIN,
    }),
    admin({
      ac,
      roles: roles as any,
      defaultRole: "customer",
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
