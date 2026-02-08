import { StorefrontFooter } from "@/components/storefront/footer"
import { StorefrontHeader } from "@/components/storefront/header"
import { getServerSession } from "@/lib/auth/rbac"

/**
 * Storefront Layout
 *
 * Layout for all public-facing pages.
 * Includes header and footer.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader
        isAuthenticated={!!session?.user}
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : undefined
        }
      />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  )
}
