import { GuestAuthPromptProvider } from "@/components/auth/guest-auth-prompt"
import { ForceLightTheme } from "@/components/force-light-theme"
import { SidebarProvider } from "@/components/ui/sidebar"
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
      <SidebarProvider mobileBreakpoint={1024} unstyled>
        <GuestAuthPromptProvider
          isAuthenticated={isAuthenticated}
          socialProviders={socialProviders}
        >
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </GuestAuthPromptProvider>
      </SidebarProvider>
      <Toaster theme="light" />
    </>
  )
}
