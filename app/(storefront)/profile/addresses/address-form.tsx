"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createAddress, updateAddress } from "@/lib/actions/profile"

const addressSchema = z.object({
  type: z.enum(["shipping", "billing", "both"]),
  isDefault: z.boolean().default(false),
  label: z.string().max(50).optional().nullable(),
  recipientName: z.string().min(2, "Recipient name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  addressLine1: z.string().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  instructions: z.string().max(500).optional().nullable(),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressFormProps {
  defaultType?: "shipping" | "billing" | "both"
  address?: {
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
}

export function AddressForm({
  defaultType = "shipping",
  address,
}: AddressFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!address

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          type: address.type,
          isDefault: address.isDefault,
          label: address.label || "",
          recipientName: address.recipientName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          city: address.city,
          state: address.state || "",
          postalCode: address.postalCode,
          country: address.country,
          instructions: address.instructions || "",
        }
      : {
          type: defaultType,
          isDefault: false,
          label: "",
          recipientName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "United States",
          instructions: "",
        },
  })

  const onSubmit = async (data: AddressFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateAddress(address.id, data)
        : await createAddress(data)

      if (result.success) {
        router.push("/profile/addresses")
        router.refresh()
      } else {
        setError("error" in result ? result.error : "Failed to save address")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Address Type</Label>
          <select
            id="type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("type")}
          >
            <option value="shipping">Shipping Address</option>
            <option value="billing">Billing Address</option>
            <option value="both">Both (Shipping & Billing)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Label (Optional)</Label>
          <Input
            id="label"
            placeholder='e.g., "Home", "Office"'
            {...register("label")}
          />
          {errors.label && (
            <p className="text-sm text-destructive">{errors.label.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recipientName">Recipient Name *</Label>
          <Input
            id="recipientName"
            placeholder="Full name"
            {...register("recipientName")}
          />
          {errors.recipientName && (
            <p className="text-sm text-destructive">
              {errors.recipientName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Phone number"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address Line 1 *</Label>
        <Input
          id="addressLine1"
          placeholder="Street address, P.O. box"
          {...register("addressLine1")}
        />
        {errors.addressLine1 && (
          <p className="text-sm text-destructive">
            {errors.addressLine1.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
        <Input
          id="addressLine2"
          placeholder="Apartment, suite, unit, building, floor, etc."
          {...register("addressLine2")}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input id="city" placeholder="City" {...register("city")} />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State / Province</Label>
          <Input
            id="state"
            placeholder="State or province"
            {...register("state")}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            placeholder="ZIP or postal code"
            {...register("postalCode")}
          />
          {errors.postalCode && (
            <p className="text-sm text-destructive">
              {errors.postalCode.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input id="country" placeholder="Country" {...register("country")} />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
        <Textarea
          id="instructions"
          placeholder="Special instructions for delivery"
          rows={3}
          {...register("instructions")}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          {...register("isDefault")}
        />
        <Label htmlFor="isDefault" className="text-sm font-normal">
          Set as default address
        </Label>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Address"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
