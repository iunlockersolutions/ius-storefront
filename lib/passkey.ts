import { passkey } from "@better-auth/passkey"

import { serverEnv } from "@/lib/env"

export function normalizeOrigin(value: string): string {
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

export function unique(values: string[]): string[] {
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
    serverEnv.NEXT_PUBLIC_SITE_URL,
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
const passkeyOrigin =
  passkeyOrigins.length === 1 ? passkeyOrigins[0] : passkeyOrigins

export const trustedOrigins = unique(
  [
    ...passkeyOrigins,
    serverEnv.SITE_URL,
    serverEnv.NEXT_PUBLIC_SITE_URL,
    serverEnv.BETTER_AUTH_URL,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeOrigin),
)

export const passkeyPlugin = passkey({
  rpID: resolvePasskeyRpId(passkeyOrigins),
  rpName: serverEnv.PASSKEY_RP_NAME,
  origin: passkeyOrigin,
})
