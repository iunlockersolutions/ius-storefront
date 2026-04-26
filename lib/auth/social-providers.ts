import { serverEnv } from "@/lib/env"

import {
  SOCIAL_PROVIDER_ORDER,
  type SocialProviderId,
} from "./social-provider-metadata"

const APPLE_TRUSTED_ORIGIN = "https://appleid.apple.com"

function readEnvValue(value?: string) {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : undefined
}

export function getSocialProvidersConfig() {
  const googleClientId = readEnvValue(serverEnv.GOOGLE_CLIENT_ID)
  const googleClientSecret = readEnvValue(serverEnv.GOOGLE_CLIENT_SECRET)
  const appleClientId = readEnvValue(serverEnv.APPLE_CLIENT_ID)
  const appleClientSecret = readEnvValue(serverEnv.APPLE_CLIENT_SECRET)
  const appleAppBundleIdentifier = readEnvValue(
    serverEnv.APPLE_APP_BUNDLE_IDENTIFIER,
  )
  const facebookClientId = readEnvValue(serverEnv.FACEBOOK_CLIENT_ID)
  const facebookClientSecret = readEnvValue(serverEnv.FACEBOOK_CLIENT_SECRET)
  const tiktokClientKey = readEnvValue(serverEnv.TIKTOK_CLIENT_KEY)
  const tiktokClientSecret = readEnvValue(serverEnv.TIKTOK_CLIENT_SECRET)

  return {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            prompt: "select_account" as const,
          },
        }
      : {}),
    ...(appleClientId && appleClientSecret
      ? {
          apple: {
            clientId: appleClientId,
            clientSecret: appleClientSecret,
            ...(appleAppBundleIdentifier
              ? {
                  appBundleIdentifier: appleAppBundleIdentifier,
                }
              : {}),
          },
        }
      : {}),
    ...(facebookClientId && facebookClientSecret
      ? {
          facebook: {
            clientId: facebookClientId,
            clientSecret: facebookClientSecret,
          },
        }
      : {}),
    ...(tiktokClientKey && tiktokClientSecret
      ? {
          tiktok: {
            clientKey: tiktokClientKey,
            clientSecret: tiktokClientSecret,
          },
        }
      : {}),
  }
}

export function getEnabledSocialProviderIds(): SocialProviderId[] {
  const socialProviders = getSocialProvidersConfig()

  return SOCIAL_PROVIDER_ORDER.filter((providerId) =>
    Boolean(socialProviders[providerId]),
  )
}

export function getAuthTrustedOrigins() {
  const enabledProviders = getEnabledSocialProviderIds()

  if (!enabledProviders.includes("apple")) {
    return []
  }

  return [APPLE_TRUSTED_ORIGIN]
}
