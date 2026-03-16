import { StorefrontFooter } from "@/components/storefront/footer"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getServerSession } from "@/lib/auth/rbac"

import StorefrontHeader from "./_components/header/storefront-header"

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  const isAuthenticated = !!session?.user

  return (
    <SidebarProvider mobileBreakpoint={1024} unstyled>
      <StorefrontHeader isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </SidebarProvider>
  )
}
