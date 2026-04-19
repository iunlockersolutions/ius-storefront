import { Suspense } from "react"

import { AuthPageSkeleton } from "@/app/auth/_components/auth-container"
import { getEnabledSocialProviderIds } from "@/lib/auth/social-providers"

import LoginForm from "./login.form"

export const metadata = {
  title: "Sign In | EvoluX",
  description: "Sign in to your EvoluX account to continue shopping.",
}

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}

function getCallbackUrl(callbackUrl?: string | string[]) {
  if (Array.isArray(callbackUrl)) {
    return callbackUrl[0] || "/"
  }

  return callbackUrl || "/"
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams
  const socialProviders = getEnabledSocialProviderIds()
  const callbackUrl = getCallbackUrl(resolvedSearchParams.callbackUrl)

  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginForm callbackUrl={callbackUrl} socialProviders={socialProviders} />
    </Suspense>
  )
}
