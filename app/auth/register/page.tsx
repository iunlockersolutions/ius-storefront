import { Suspense } from "react"

import { AuthPageSkeleton } from "@/app/auth/_components/auth-container"
import { getEnabledSocialProviderIds } from "@/lib/auth/social-providers"

import RegisterForm from "./register.form"

export const metadata = {
  title: "Create Account | EvoluX",
  description:
    "Create an EvoluX account for faster checkout and order tracking.",
}

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}

function getCallbackUrl(callbackUrl?: string | string[]) {
  if (Array.isArray(callbackUrl)) {
    return callbackUrl[0] || "/"
  }

  return callbackUrl || "/"
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const resolvedSearchParams = await searchParams
  const socialProviders = getEnabledSocialProviderIds()
  const callbackUrl = getCallbackUrl(resolvedSearchParams.callbackUrl)

  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <RegisterForm
        callbackUrl={callbackUrl}
        socialProviders={socialProviders}
      />
    </Suspense>
  )
}
