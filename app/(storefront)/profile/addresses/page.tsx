import Link from "next/link"
import { redirect } from "next/navigation"

import { ChevronLeft, Plus } from "lucide-react"

import { GroupedAddressList } from "@/components/storefront/profile/address-list"
import { Button } from "@/components/ui/button"
import { getMaxAddressesPerUser, getUserAddresses } from "@/lib/actions/profile"
import { getServerSession } from "@/lib/auth/rbac"

export const metadata = {
  title: "Address Book",
  description: "Manage your shipping and billing addresses",
}

export default async function AddressesPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/sign-in?callbackUrl=/profile/addresses")
  }

  const [addresses, maxAddresses] = await Promise.all([
    getUserAddresses(),
    getMaxAddressesPerUser(),
  ])
  const canAddMore = addresses.length < maxAddresses

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Profile
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Address Book</h1>
            <p className="text-muted-foreground mt-1">
              Manage your shipping and billing addresses ({addresses.length}/
              {maxAddresses})
            </p>
          </div>
          {canAddMore && (
            <Button asChild>
              <Link href="/profile/addresses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Link>
            </Button>
          )}
        </div>
      </div>

      <GroupedAddressList addresses={addresses} maxAddresses={maxAddresses} />
    </div>
  )
}
