import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { ChevronLeft } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAddress } from "@/lib/actions/profile"
import { getServerSession } from "@/lib/auth/rbac"

import { AddressForm } from "../../address-form"

interface EditAddressPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Address",
  description: "Edit your address",
}

export default async function EditAddressPage({
  params,
}: EditAddressPageProps) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/sign-in?callbackUrl=/profile/addresses")
  }

  const { id } = await params
  const address = await getAddress(id)

  if (!address) {
    notFound()
  }

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
          <CardTitle>Edit Address</CardTitle>
          <CardDescription>Update your address information</CardDescription>
        </CardHeader>
        <CardContent>
          <AddressForm address={address} />
        </CardContent>
      </Card>
    </div>
  )
}
