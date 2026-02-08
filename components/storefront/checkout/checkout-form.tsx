"use client"

import { useEffect, useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Check,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createOrder } from "@/lib/actions/checkout"
import {
  calculateOrderTotals,
  type CheckoutData,
  contactInfoSchema,
  shippingAddressSchema,
} from "@/lib/schemas/checkout"
import { cn } from "@/lib/utils"

interface CustomerAddress {
  id: string
  type: string
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
  isDefault: boolean
  label: string | null
}

interface CheckoutFormProps {
  addresses: CustomerAddress[]
  isLoggedIn: boolean
  userEmail: string
}

// Combined schema for all checkout data
const checkoutFormSchema = z.object({
  // Contact
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone number is required"),
  // Shipping
  selectedAddressId: z.string().optional(),
  recipientName: z.string().min(2, "Name is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  instructions: z.string().optional(),
  saveAddress: z.boolean().optional(),
  // Shipping method
  shippingMethod: z.enum(["standard", "express"]),
  // Payment
  paymentMethod: z.enum(["card", "bank_transfer", "cod"]),
  // Notes
  notes: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutFormSchema>

const STEPS = [
  { id: 1, name: "Contact", icon: Mail },
  { id: 2, name: "Shipping", icon: MapPin },
  { id: 3, name: "Payment", icon: CreditCard },
  { id: 4, name: "Review", icon: Check },
]

export function CheckoutForm({
  addresses,
  isLoggedIn,
  userEmail,
}: CheckoutFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id || null,
  )

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: userEmail,
      shippingMethod: "standard",
      paymentMethod: "card",
      country: "US",
      saveAddress: false,
    },
  })

  const shippingMethod = watch("shippingMethod")
  const paymentMethod = watch("paymentMethod")

  // Pre-fill form with default address on mount
  useEffect(() => {
    const defaultAddress = addresses.find((a) => a.isDefault)
    if (defaultAddress) {
      setValue("selectedAddressId", defaultAddress.id)
      setValue("recipientName", defaultAddress.recipientName)
      setValue("phone", defaultAddress.phone)
      setValue("addressLine1", defaultAddress.addressLine1)
      setValue("addressLine2", defaultAddress.addressLine2 || "")
      setValue("city", defaultAddress.city)
      setValue("state", defaultAddress.state || "")
      setValue("postalCode", defaultAddress.postalCode)
      setValue("country", defaultAddress.country)
    }
  }, [addresses, setValue])

  // Handle address selection
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    const address = addresses.find((a) => a.id === addressId)
    if (address) {
      setValue("selectedAddressId", addressId)
      setValue("recipientName", address.recipientName)
      setValue("phone", address.phone)
      setValue("addressLine1", address.addressLine1)
      setValue("addressLine2", address.addressLine2 || "")
      setValue("city", address.city)
      setValue("state", address.state || "")
      setValue("postalCode", address.postalCode)
      setValue("country", address.country)
    }
  }

  // Validate current step before proceeding
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(["email"])
      case 2:
        return await trigger([
          "recipientName",
          "phone",
          "addressLine1",
          "city",
          "postalCode",
          "country",
        ])
      case 3:
        return await trigger(["shippingMethod", "paymentMethod"])
      default:
        return true
    }
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const onSubmit = async (data: CheckoutFormData) => {
    const checkoutData: CheckoutData = {
      contact: {
        email: data.email,
        phone: data.phone,
      },
      shipping: {
        addressId: data.selectedAddressId,
        recipientName: data.recipientName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        instructions: data.instructions,
        saveAddress: data.saveAddress,
      },
      shippingMethod: data.shippingMethod,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    }

    startTransition(async () => {
      const result = await createOrder(checkoutData)

      if (result.success) {
        // Dispatch cart update event to reset badge
        window.dispatchEvent(new Event("cart-updated"))

        toast.success("Order placed successfully!", {
          description: `Order #${result.orderNumber}`,
        })
        router.push(`/checkout/success?orderId=${result.orderId}`)
      } else {
        toast.error(result.error || "Failed to place order")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                disabled={step.id > currentStep}
                className={cn(
                  "flex flex-col items-center gap-2 w-full",
                  step.id <= currentStep ? "cursor-pointer" : "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    currentStep > step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.id
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground",
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    currentStep >= step.id
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Contact Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={isLoggedIn}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Shipping Address */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Saved Addresses */}
            {addresses.length > 0 && (
              <div className="space-y-2">
                <Label>Saved Addresses</Label>
                <div className="grid gap-3">
                  {addresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => handleAddressSelect(address.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-colors",
                        selectedAddressId === address.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{address.recipientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.addressLine1}
                            {address.addressLine2 &&
                              `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                        </div>
                        {address.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(null)
                      setValue("selectedAddressId", "")
                      setValue("recipientName", "")
                      setValue("phone", "")
                      setValue("addressLine1", "")
                      setValue("addressLine2", "")
                      setValue("city", "")
                      setValue("state", "")
                      setValue("postalCode", "")
                    }}
                    className={cn(
                      "p-4 rounded-lg border border-dashed text-center transition-colors",
                      !selectedAddressId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <p className="font-medium">+ Add New Address</p>
                  </button>
                </div>
              </div>
            )}

            {/* Address Form */}
            {(!addresses.length || !selectedAddressId) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Full Name *</Label>
                  <Input id="recipientName" {...register("recipientName")} />
                  {errors.recipientName && (
                    <p className="text-sm text-red-500">
                      {errors.recipientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" {...register("phone")} />
                  {errors.phone && (
                    <p className="text-sm text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Street address"
                    {...register("addressLine1")}
                  />
                  {errors.addressLine1 && (
                    <p className="text-sm text-red-500">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">
                    Apartment, suite, etc. (Optional)
                  </Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apt, suite, unit, building, floor, etc."
                    {...register("addressLine2")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" {...register("city")} />
                    {errors.city && (
                      <p className="text-sm text-red-500">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" {...register("state")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input id="postalCode" {...register("postalCode")} />
                    {errors.postalCode && (
                      <p className="text-sm text-red-500">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Controller
                      control={control}
                      name="country"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.country && (
                      <p className="text-sm text-red-500">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                </div>

                {isLoggedIn && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      {...register("saveAddress")}
                    />
                    <span className="text-sm">
                      Save this address for future orders
                    </span>
                  </label>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Shipping & Payment */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Shipping Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Controller
                control={control}
                name="shippingMethod"
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => field.onChange("standard")}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-colors",
                        field.value === "standard"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Standard Shipping</p>
                            <p className="text-sm text-muted-foreground">
                              5-7 business days
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">Free over $100</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("express")}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-colors",
                        field.value === "express"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="font-medium">Express Shipping</p>
                            <p className="text-sm text-muted-foreground">
                              1-2 business days
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">$19.99</p>
                      </div>
                    </button>
                  </>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => field.onChange("card")}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-colors",
                        field.value === "card"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-muted-foreground">
                            Pay securely with your card
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("bank_transfer")}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-colors",
                        field.value === "bank_transfer"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Landmark className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-sm text-muted-foreground">
                            Transfer directly to our bank account
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("cod")}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-colors",
                        field.value === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            Pay when your order arrives
                          </p>
                        </div>
                      </div>
                    </button>
                  </>
                )}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Review Order */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Review Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                >
                  Edit
                </Button>
              </div>
              <p className="text-muted-foreground">{watch("email")}</p>
              {watch("phone") && (
                <p className="text-muted-foreground">{watch("phone")}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                >
                  Edit
                </Button>
              </div>
              <p className="text-muted-foreground">{watch("recipientName")}</p>
              <p className="text-muted-foreground">{watch("phone")}</p>
              <p className="text-muted-foreground">
                {watch("addressLine1")}
                {watch("addressLine2") && `, ${watch("addressLine2")}`}
              </p>
              <p className="text-muted-foreground">
                {watch("city")}, {watch("state")} {watch("postalCode")}
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipping Method
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                >
                  Edit
                </Button>
              </div>
              <p className="text-muted-foreground">
                {shippingMethod === "standard"
                  ? "Standard Shipping (5-7 business days)"
                  : "Express Shipping (1-2 business days)"}
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                >
                  Edit
                </Button>
              </div>
              <p className="text-muted-foreground">
                {paymentMethod === "card"
                  ? "Credit/Debit Card"
                  : paymentMethod === "bank_transfer"
                    ? "Bank Transfer"
                    : "Cash on Delivery"}
              </p>
            </div>

            {/* Order Notes */}
            <div className="border-t pt-4">
              <Label htmlFor="notes">Order Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for your order..."
                className="mt-2"
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <Button type="button" onClick={handleNext}>
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        )}
      </div>
    </form>
  )
}
