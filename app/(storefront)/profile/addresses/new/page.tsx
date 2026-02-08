import Link from "next/link"
import { redirect } from "next/navigation"

import { ChevronLeft } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getServerSession } from "@/lib/auth/rbac"

import { AddressForm } from "../address-form"

interface NewAddressPageProps {
  searchParams: Promise<{ type?: string }>
}

export const metadata = {
  title: "Add Address",
  description: "Add a new address to your address book",
}

export default async function NewAddressPage({
  searchParams,
}: NewAddressPageProps) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/sign-in?callbackUrl=/profile/addresses/new")
  }

  const params = await searchParams
  const defaultType = params.type === "billing" ? "billing" : "shipping"

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/profile/addresses"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Addresses
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add New Address</CardTitle>
          <CardDescription>
            Add a new shipping or billing address to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressForm defaultType={defaultType} />
        </CardContent>
      </Card>
    </div>
  )
}
