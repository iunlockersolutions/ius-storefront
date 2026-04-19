"use client"

import type { ComponentType, SVGProps } from "react"
import { useState } from "react"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Apple, Facebook, Google, TikTok } from "@/components/icons/svg"
import { Button } from "@/components/ui/button"
import {
  SOCIAL_PROVIDER_LABELS,
  type SocialProviderId,
} from "@/lib/auth/social-provider-metadata"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const providerIcons: Record<
  SocialProviderId,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  google: Google,
  apple: Apple,
  facebook: Facebook,
  tiktok: TikTok,
}

interface SocialLoginButtonsProps {
  callbackUrl: string
  providers: SocialProviderId[]
  mode?: "signin" | "signup" | "continue"
  layout?: "stack" | "grid"
  disabled?: boolean
}

export function SocialLoginButtons({
  callbackUrl,
  providers,
  mode = "signin",
  layout = "stack",
  disabled = false,
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] =
    useState<SocialProviderId | null>(null)

  const handleSocialLogin = async (provider: SocialProviderId) => {
    setLoadingProvider(provider)

    try {
      // Use the auth callback page for role-based redirect.
      const authCallbackUrl = `/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`

      await authClient.signIn.social({
        provider,
        callbackURL: authCallbackUrl,
      })
    } catch {
      toast.error(
        `Failed to ${mode === "signup" ? "sign up" : mode} with ${SOCIAL_PROVIDER_LABELS[provider]}`,
      )
      setLoadingProvider(null)
    }
  }

  if (providers.length === 0) {
    return null
  }

  const isLoading = loadingProvider !== null
  const actionText =
    mode === "signup" ? "Sign up" : mode === "continue" ? "Continue" : "Sign in"

  return (
    <div
      className={cn(
        layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "space-y-3",
      )}
    >
      {providers.map((provider) => {
        const Icon = providerIcons[provider]

        return (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="border-input bg-background/80 text-foreground hover:bg-secondary h-12 w-full justify-center rounded-2xl shadow-none"
            onClick={() => handleSocialLogin(provider)}
            disabled={disabled || isLoading}
          >
            {loadingProvider === provider ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-4 w-4 shrink-0" />
            )}
            {actionText} with {SOCIAL_PROVIDER_LABELS[provider]}
          </Button>
        )
      })}
    </div>
  )
}
