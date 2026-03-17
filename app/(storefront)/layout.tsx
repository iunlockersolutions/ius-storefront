import { SidebarProvider } from "@/components/ui/sidebar"
import { getServerSession } from "@/lib/auth/rbac"

import { Footer } from "./_components/footer"
import Header from "./_components/header"

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  const isAuthenticated = !!session?.user

  return (
    <SidebarProvider mobileBreakpoint={1024} unstyled>
      <Header isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <Footer />
    </SidebarProvider>
  )
}
