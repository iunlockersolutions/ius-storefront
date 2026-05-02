import { GuestAuthPromptProvider } from "@/components/auth/guest-auth-prompt"
import { ForceLightTheme } from "@/components/force-light-theme"
import { Toaster } from "@/components/ui/sonner"
import { getServerSession } from "@/lib/auth/rbac"
import { getEnabledSocialProviderIds } from "@/lib/auth/social-providers"

import { Footer } from "./_components/footer"
import { Header } from "./_components/header"
import { type HeaderUser } from "./_components/header/types"

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  const user: HeaderUser | undefined = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image,
      }
    : undefined
  const isAuthenticated = !!user
  const socialProviders = getEnabledSocialProviderIds()

  return (
    <div
      className="flex min-h-screen flex-col"
      data-storefront-mobile-align="center"
    >
      <ForceLightTheme />
      <GuestAuthPromptProvider
        isAuthenticated={isAuthenticated}
        socialProviders={socialProviders}
      >
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </GuestAuthPromptProvider>
      <Toaster theme="light" />
    </div>
  )
}
