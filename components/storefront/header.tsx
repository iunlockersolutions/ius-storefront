import { getStorefrontNavigationData } from "@/lib/storefront/navigation"

import { StorefrontHeaderClient } from "./header-client"

interface StorefrontHeaderProps {
  isAuthenticated?: boolean
  user?: {
    name?: string | null
    email: string
    image?: string | null
  }
}

export async function StorefrontHeader({
  isAuthenticated = false,
  user,
}: StorefrontHeaderProps) {
  const navigation = await getStorefrontNavigationData()

  return (
    <StorefrontHeaderClient
      isAuthenticated={isAuthenticated}
      navigation={navigation}
      user={user}
    />
  )
}
