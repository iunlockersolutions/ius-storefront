"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  Building,
  Home,
  Loader2,
  MapPin,
  MoreVertical,
  Package,
  Pencil,
  Star,
  Trash2,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteAddress, setDefaultAddress } from "@/lib/actions/profile"
import { cn } from "@/lib/utils"

// Address type from the database
export interface Address {
  id: string
  type: "shipping" | "billing" | "both"
  isDefault: boolean
  label: string | null
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
  instructions: string | null
}

interface AddressListProps {
  addresses: Address[]
  maxAddresses?: number
  emptyMessage?: string
  showAddButton?: boolean
  filterType?: "shipping" | "billing" | "all"
}

/**
 * Address type badge component
 */
function AddressTypeBadge({ type }: { type: "shipping" | "billing" | "both" }) {
  const config = {
    shipping: {
      label: "Shipping",
      icon: Package,
      variant: "outline" as const,
      className:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
    },
    billing: {
      label: "Billing",
      icon: Building,
      variant: "outline" as const,
      className:
        "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
    },
    both: {
      label: "Shipping & Billing",
      icon: Home,
      variant: "outline" as const,
      className:
        "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
    },
  }

  const { label, icon: Icon, className } = config[type]

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-normal gap-1", className)}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

/**
 * Individual address card with actions
 */
interface AddressCardProps {
  address: Address
  onSetDefault?: () => void
  onDelete?: () => void
  isPending?: boolean
}

function AddressCard({
  address,
  onSetDefault,
  onDelete,
  isPending,
}: AddressCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Card
        className={cn(
          "transition-all",
          address.isDefault && "border-primary ring-1 ring-primary/20",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base truncate">
                  {address.recipientName}
                </CardTitle>
                {address.isDefault && (
                  <Badge className="text-xs shrink-0">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <AddressTypeBadge type={address.type} />
                {address.label && (
                  <span className="text-xs text-muted-foreground">
                    {address.label}
                  </span>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/profile/addresses/${address.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {!address.isDefault && onSetDefault && (
                  <DropdownMenuItem onClick={onSetDefault}>
                    <Star className="mr-2 h-4 w-4" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-1 text-sm">
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}
            {address.state && `, ${address.state}`} {address.postalCode}
          </p>
          <p>{address.country}</p>
          <p className="text-muted-foreground mt-2">{address.phone}</p>
          {address.instructions && (
            <p className="text-muted-foreground italic mt-2">
              &quot;{address.instructions}&quot;
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.()
                setShowDeleteDialog(false)
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Empty state component for address list
 */
interface EmptyAddressStateProps {
  type?: "shipping" | "billing" | "all"
  message?: string
}

function EmptyAddressState({ type = "all", message }: EmptyAddressStateProps) {
  const typeLabels = {
    shipping: "shipping",
    billing: "billing",
    all: "saved",
  }

  return (
    <Card>
      <CardContent className="py-8 text-center">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-medium">
          {message || `No ${typeLabels[type]} addresses`}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add an address for faster checkout
        </p>
        <Button asChild className="mt-4">
          <Link
            href={`/profile/addresses/new${type !== "all" ? `?type=${type}` : ""}`}
          >
            Add Address
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Enhanced address list component with badges and actions
 */
export function AddressList({
  addresses,
  maxAddresses,
  emptyMessage,
  showAddButton = true,
  filterType = "all",
}: AddressListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAddressId, setPendingAddressId] = useState<string | null>(null)

  // Filter addresses by type if specified
  const filteredAddresses =
    filterType === "all"
      ? addresses
      : addresses.filter((a) => a.type === filterType || a.type === "both")

  const handleSetDefault = (addressId: string) => {
    setPendingAddressId(addressId)
    startTransition(async () => {
      await setDefaultAddress(addressId)
      setPendingAddressId(null)
      router.refresh()
    })
  }

  const handleDelete = (addressId: string) => {
    setPendingAddressId(addressId)
    startTransition(async () => {
      await deleteAddress(addressId)
      setPendingAddressId(null)
      router.refresh()
    })
  }

  const canAddMore = !maxAddresses || addresses.length < maxAddresses
  const remainingSlots = maxAddresses ? maxAddresses - addresses.length : null

  if (filteredAddresses.length === 0) {
    return <EmptyAddressState type={filterType} message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {filteredAddresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onSetDefault={() => handleSetDefault(address.id)}
            onDelete={() => handleDelete(address.id)}
            isPending={isPending && pendingAddressId === address.id}
          />
        ))}
      </div>

      {showAddButton && (
        <div className="flex items-center justify-between pt-4">
          {canAddMore ? (
            <Button variant="outline" asChild>
              <Link href="/profile/addresses/new">Add New Address</Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Maximum number of addresses reached ({maxAddresses})
            </p>
          )}
          {remainingSlots !== null && remainingSlots > 0 && (
            <p className="text-sm text-muted-foreground">
              {remainingSlots} address{remainingSlots !== 1 ? "es" : ""}{" "}
              remaining
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Grouped address list by type (shipping/billing)
 */
interface GroupedAddressListProps {
  addresses: Address[]
  maxAddresses?: number
}

export function GroupedAddressList({
  addresses,
  maxAddresses,
}: GroupedAddressListProps) {
  const shippingAddresses = addresses.filter(
    (a) => a.type === "shipping" || a.type === "both",
  )
  const billingAddresses = addresses.filter(
    (a) => a.type === "billing" || a.type === "both",
  )

  const canAddMore = !maxAddresses || addresses.length < maxAddresses

  return (
    <div className="space-y-8">
      {/* Shipping Addresses */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Shipping Addresses</h2>
          <Badge variant="secondary" className="ml-auto">
            {shippingAddresses.length}
          </Badge>
        </div>
        <AddressList
          addresses={addresses}
          filterType="shipping"
          maxAddresses={maxAddresses}
          showAddButton={false}
        />
      </section>

      {/* Billing Addresses */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Billing Addresses</h2>
          <Badge variant="secondary" className="ml-auto">
            {billingAddresses.length}
          </Badge>
        </div>
        <AddressList
          addresses={addresses}
          filterType="billing"
          maxAddresses={maxAddresses}
          showAddButton={false}
        />
      </section>

      {/* Add button */}
      {canAddMore && (
        <div className="flex justify-center pt-4">
          <Button asChild>
            <Link href="/profile/addresses/new">Add New Address</Link>
          </Button>
        </div>
      )}
      {maxAddresses && !canAddMore && (
        <p className="text-center text-sm text-muted-foreground pt-4">
          Maximum number of addresses reached ({maxAddresses})
        </p>
      )}
    </div>
  )
}

export { AddressCard, AddressTypeBadge, EmptyAddressState }
