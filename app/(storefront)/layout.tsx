import { GuestAuthPromptProvider } from "@/components/auth/guest-auth-prompt"
import { ForceLightTheme } from "@/components/force-light-theme"
import { Toaster } from "@/components/ui/sonner"
import { getServerSession } from "@/lib/auth/rbac"
import { getEnabledSocialProviderIds } from "@/lib/auth/social-providers"

import { Footer } from "./_components/footer"
import Header from "./_components/header"
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
        image: session.user.image,
        role: session.user.role,
      }
    : undefined
  const isAuthenticated = !!user
  const socialProviders = getEnabledSocialProviderIds()

  return (
    <>
      <ForceLightTheme />
      <GuestAuthPromptProvider
        isAuthenticated={isAuthenticated}
        socialProviders={socialProviders}
      >
        <Header user={user} />
        <main>{children}</main>
        <Footer />
      </GuestAuthPromptProvider>
      <Toaster theme="light" />
    </>
  )
}
