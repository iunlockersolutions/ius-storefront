export const SOCIAL_PROVIDER_ORDER = [
  "google",
  "apple",
  "facebook",
  "tiktok",
] as const

export type SocialProviderId = (typeof SOCIAL_PROVIDER_ORDER)[number]

export const SOCIAL_PROVIDER_LABELS = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
  tiktok: "TikTok",
} satisfies Record<SocialProviderId, string>
