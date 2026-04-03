import { ForceLightTheme } from "@/components/force-light-theme"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
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
    <>
      <ForceLightTheme />
      <SidebarProvider mobileBreakpoint={1024} unstyled>
        <Header isAuthenticated={isAuthenticated} />
        <main className="flex-1">{children}</main>
        <Footer />
      </SidebarProvider>
      <Toaster theme="light" />
    </>
  )
}
