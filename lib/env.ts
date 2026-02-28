import { z } from "zod"

const csvUrlList = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .every((item) => {
        try {
          new URL(item)
          return true
        } catch {
          return false
        }
      })
  }, "PASSKEY_ORIGIN must be a valid URL or comma-separated list of URLs")

/**
 * Server-side environment variables schema.
 * These are validated at build time and runtime.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  SITE_URL: z.string().url("SITE_URL must be a valid URL"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  PASSKEY_RP_NAME: z.string().min(1).optional(),
  PASSKEY_RP_ID: z.string().min(1).optional(),
  PASSKEY_ORIGIN: csvUrlList,
  PAYMENT_PROVIDER_SECRET: z.string().optional(),
  PAYMENT_PROVIDER_WEBHOOK_SECRET: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
})

/**
 * Client-side environment variables schema.
 * Only NEXT_PUBLIC_ prefixed variables should be here.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
})

/**
 * Validate and parse server environment variables.
 * Throws detailed error if validation fails.
 */
function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error(
      "❌ Invalid server environment variables:",
      parsed.error.flatten().fieldErrors,
    )
    throw new Error("Invalid server environment variables")
  }

  return parsed.data
}

/**
 * Validate and parse client environment variables.
 */
function validateClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  })

  if (!parsed.success) {
    console.error(
      "❌ Invalid client environment variables:",
      parsed.error.flatten().fieldErrors,
    )
    throw new Error("Invalid client environment variables")
  }

  return parsed.data
}

// Export validated environment variables
export const serverEnv = validateServerEnv()
export const clientEnv = validateClientEnv()

// Type exports for use throughout the application
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
