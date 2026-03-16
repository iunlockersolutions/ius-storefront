"use client"

import { useEffect, useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Check,
  CheckSquare,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Package,
  Truck,
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
import { type CheckoutData } from "@/lib/schemas/checkout"
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
  contactPhone: z.string().optional(),
  // Shipping
  selectedShippingAddressId: z.string().optional(),
  shippingRecipientName: z.string().min(2, "Name is required"),
  shippingPhone: z.string().min(10, "Phone number is required"),
  shippingAddressLine1: z.string().min(5, "Address is required"),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string().min(2, "City is required"),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().min(3, "Postal code is required"),
  shippingCountry: z.string().min(2, "Country is required"),
  shippingInstructions: z.string().optional(),
  saveShippingAddress: z.boolean().optional(),
  // Billing
  useShippingAsBilling: z.boolean().default(true),
  selectedBillingAddressId: z.string().optional(),
  billingRecipientName: z.string().optional(),
  billingPhone: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  saveBillingAddress: z.boolean().optional(),
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
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<
    string | null
  >(null)
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | null
  >(null)

  const shippingAddresses = addresses.filter(
    (address) => address.type === "shipping" || address.type === "both",
  )
  const billingAddresses = addresses.filter(
    (address) => address.type === "billing" || address.type === "both",
  )
  const fallbackShippingAddresses =
    shippingAddresses.length > 0 ? shippingAddresses : addresses
  const fallbackBillingAddresses =
    billingAddresses.length > 0 ? billingAddresses : addresses

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
      contactPhone: "",
      shippingMethod: "standard",
      paymentMethod: "card",
      shippingCountry: "US",
      billingCountry: "US",
      useShippingAsBilling: true,
      saveShippingAddress: false,
      saveBillingAddress: false,
    },
  })

  const shippingMethod = watch("shippingMethod")
  const paymentMethod = watch("paymentMethod")
  const useShippingAsBilling = watch("useShippingAsBilling")

  // Pre-fill form with default address on mount
  useEffect(() => {
    const defaultShippingAddress =
      fallbackShippingAddresses.find((a) => a.isDefault) ??
      fallbackShippingAddresses[0]
    const defaultBillingAddress =
      fallbackBillingAddresses.find((a) => a.isDefault) ??
      fallbackBillingAddresses[0]

    if (defaultShippingAddress) {
      handleShippingAddressSelect(defaultShippingAddress.id)
    }

    if (defaultBillingAddress) {
      handleBillingAddressSelect(defaultBillingAddress.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, setValue])

  // Handle address selection
  const handleShippingAddressSelect = (addressId: string) => {
    setSelectedShippingAddressId(addressId)
    const address = fallbackShippingAddresses.find((a) => a.id === addressId)
    if (address) {
      setValue("selectedShippingAddressId", addressId)
      setValue("shippingRecipientName", address.recipientName)
      setValue("shippingPhone", address.phone)
      setValue("shippingAddressLine1", address.addressLine1)
      setValue("shippingAddressLine2", address.addressLine2 || "")
      setValue("shippingCity", address.city)
      setValue("shippingState", address.state || "")
      setValue("shippingPostalCode", address.postalCode)
      setValue("shippingCountry", address.country)
    }
  }

  const handleBillingAddressSelect = (addressId: string) => {
    setSelectedBillingAddressId(addressId)
    const address = fallbackBillingAddresses.find((a) => a.id === addressId)
    if (address) {
      setValue("selectedBillingAddressId", addressId)
      setValue("billingRecipientName", address.recipientName)
      setValue("billingPhone", address.phone)
      setValue("billingAddressLine1", address.addressLine1)
      setValue("billingAddressLine2", address.addressLine2 || "")
      setValue("billingCity", address.city)
      setValue("billingState", address.state || "")
      setValue("billingPostalCode", address.postalCode)
      setValue("billingCountry", address.country)
    }
  }

  // Validate current step before proceeding
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(["email"])
      case 2:
        if (useShippingAsBilling) {
          return await trigger([
            "shippingRecipientName",
            "shippingPhone",
            "shippingAddressLine1",
            "shippingCity",
            "shippingPostalCode",
            "shippingCountry",
          ])
        }

        return await trigger([
          "shippingRecipientName",
          "shippingPhone",
          "shippingAddressLine1",
          "shippingCity",
          "shippingPostalCode",
          "shippingCountry",
          "billingRecipientName",
          "billingPhone",
          "billingAddressLine1",
          "billingCity",
          "billingPostalCode",
          "billingCountry",
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
    const resolvedBilling = data.useShippingAsBilling
      ? {
          addressId: data.selectedShippingAddressId,
          recipientName: data.shippingRecipientName,
          phone: data.shippingPhone,
          addressLine1: data.shippingAddressLine1,
          addressLine2: data.shippingAddressLine2,
          city: data.shippingCity,
          state: data.shippingState,
          postalCode: data.shippingPostalCode,
          country: data.shippingCountry,
          saveAddress: data.saveShippingAddress,
        }
      : {
          addressId: data.selectedBillingAddressId,
          recipientName: data.billingRecipientName || "",
          phone: data.billingPhone || "",
          addressLine1: data.billingAddressLine1 || "",
          addressLine2: data.billingAddressLine2,
          city: data.billingCity || "",
          state: data.billingState,
          postalCode: data.billingPostalCode || "",
          country: data.billingCountry || "",
          saveAddress: data.saveBillingAddress,
        }

    const checkoutData: CheckoutData = {
      contact: {
        email: data.email,
        phone: data.contactPhone,
      },
      shipping: {
        addressId: data.selectedShippingAddressId,
        recipientName: data.shippingRecipientName,
        phone: data.shippingPhone,
        addressLine1: data.shippingAddressLine1,
        addressLine2: data.shippingAddressLine2,
        city: data.shippingCity,
        state: data.shippingState,
        postalCode: data.shippingPostalCode,
        country: data.shippingCountry,
        instructions: data.shippingInstructions,
        saveAddress: data.saveShippingAddress,
      },
      billing: resolvedBilling,
      useShippingAsBilling: data.useShippingAsBilling,
      shippingMethod: data.shippingMethod,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    }

    startTransition(async () => {
      const result = await createOrder(checkoutData)

      if (result.success) {
        if (!result.orderId) {
          toast.error("Order was created but confirmation link is missing")
          return
        }

        toast.success("Order placed successfully!", {
          description: `Order #${result.orderNumber}`,
        })

        // Use hard navigation to avoid intermittent app-router race conditions
        // where checkout re-renders with an empty cart before success navigation settles.
        window.location.assign(`/checkout/success?orderId=${result.orderId}`)
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
              <Label htmlFor="contactPhone">Phone Number (Optional)</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register("contactPhone")}
              />
              {errors.contactPhone && (
                <p className="text-sm text-red-500">
                  {errors.contactPhone.message}
                </p>
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
                  {fallbackShippingAddresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => handleShippingAddressSelect(address.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-colors",
                        selectedShippingAddressId === address.id
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
                        <Badge variant="secondary" className="capitalize">
                          {address.type}
                        </Badge>
                        {address.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShippingAddressId(null)
                      setValue("selectedShippingAddressId", "")
                      setValue("shippingRecipientName", "")
                      setValue("shippingPhone", "")
                      setValue("shippingAddressLine1", "")
                      setValue("shippingAddressLine2", "")
                      setValue("shippingCity", "")
                      setValue("shippingState", "")
                      setValue("shippingPostalCode", "")
                    }}
                    className={cn(
                      "p-4 rounded-lg border border-dashed text-center transition-colors",
                      !selectedShippingAddressId
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
            {(!fallbackShippingAddresses.length ||
              !selectedShippingAddressId) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shippingRecipientName">Full Name *</Label>
                  <Input
                    id="shippingRecipientName"
                    {...register("shippingRecipientName")}
                  />
                  {errors.shippingRecipientName && (
                    <p className="text-sm text-red-500">
                      {errors.shippingRecipientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingPhone">Phone Number *</Label>
                  <Input
                    id="shippingPhone"
                    type="tel"
                    {...register("shippingPhone")}
                  />
                  {errors.shippingPhone && (
                    <p className="text-sm text-red-500">
                      {errors.shippingPhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddressLine1">Address *</Label>
                  <Input
                    id="shippingAddressLine1"
                    placeholder="Street address"
                    {...register("shippingAddressLine1")}
                  />
                  {errors.shippingAddressLine1 && (
                    <p className="text-sm text-red-500">
                      {errors.shippingAddressLine1.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddressLine2">
                    Apartment, suite, etc. (Optional)
                  </Label>
                  <Input
                    id="shippingAddressLine2"
                    placeholder="Apt, suite, unit, building, floor, etc."
                    {...register("shippingAddressLine2")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCity">City *</Label>
                    <Input id="shippingCity" {...register("shippingCity")} />
                    {errors.shippingCity && (
                      <p className="text-sm text-red-500">
                        {errors.shippingCity.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingState">State/Province</Label>
                    <Input id="shippingState" {...register("shippingState")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingPostalCode">Postal Code *</Label>
                    <Input
                      id="shippingPostalCode"
                      {...register("shippingPostalCode")}
                    />
                    {errors.shippingPostalCode && (
                      <p className="text-sm text-red-500">
                        {errors.shippingPostalCode.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingCountry">Country *</Label>
                    <Controller
                      control={control}
                      name="shippingCountry"
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
                    {errors.shippingCountry && (
                      <p className="text-sm text-red-500">
                        {errors.shippingCountry.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingInstructions">
                    Delivery Instructions (Optional)
                  </Label>
                  <Textarea
                    id="shippingInstructions"
                    placeholder="Gate code, landmark, delivery notes..."
                    {...register("shippingInstructions")}
                  />
                </div>

                {isLoggedIn && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      {...register("saveShippingAddress")}
                    />
                    <span className="text-sm">
                      Save this shipping address for future orders
                    </span>
                  </label>
                )}
              </>
            )}

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Billing Address
                </h3>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={useShippingAsBilling}
                    onChange={(event) =>
                      setValue("useShippingAsBilling", event.target.checked)
                    }
                  />
                  Same as shipping
                </label>
              </div>

              {!useShippingAsBilling && (
                <>
                  {fallbackBillingAddresses.length > 0 && (
                    <div className="space-y-2">
                      <Label>Saved Billing Addresses</Label>
                      <div className="grid gap-3">
                        {fallbackBillingAddresses.map((address) => (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() =>
                              handleBillingAddressSelect(address.id)
                            }
                            className={cn(
                              "p-4 rounded-lg border text-left transition-colors",
                              selectedBillingAddressId === address.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">
                                  {address.recipientName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.addressLine1}
                                  {address.addressLine2 &&
                                    `, ${address.addressLine2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state}{" "}
                                  {address.postalCode}
                                </p>
                              </div>
                              <Badge variant="secondary" className="capitalize">
                                {address.type}
                              </Badge>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBillingAddressId(null)
                            setValue("selectedBillingAddressId", "")
                            setValue("billingRecipientName", "")
                            setValue("billingPhone", "")
                            setValue("billingAddressLine1", "")
                            setValue("billingAddressLine2", "")
                            setValue("billingCity", "")
                            setValue("billingState", "")
                            setValue("billingPostalCode", "")
                          }}
                          className={cn(
                            "p-4 rounded-lg border border-dashed text-center transition-colors",
                            !selectedBillingAddressId
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <p className="font-medium">
                            + Add New Billing Address
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {(!fallbackBillingAddresses.length ||
                    !selectedBillingAddressId) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="billingRecipientName">
                          Full Name *
                        </Label>
                        <Input
                          id="billingRecipientName"
                          {...register("billingRecipientName")}
                        />
                        {errors.billingRecipientName && (
                          <p className="text-sm text-red-500">
                            {errors.billingRecipientName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingPhone">Phone Number *</Label>
                        <Input
                          id="billingPhone"
                          type="tel"
                          {...register("billingPhone")}
                        />
                        {errors.billingPhone && (
                          <p className="text-sm text-red-500">
                            {errors.billingPhone.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingAddressLine1">Address *</Label>
                        <Input
                          id="billingAddressLine1"
                          {...register("billingAddressLine1")}
                        />
                        {errors.billingAddressLine1 && (
                          <p className="text-sm text-red-500">
                            {errors.billingAddressLine1.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingAddressLine2">
                          Apartment, suite, etc. (Optional)
                        </Label>
                        <Input
                          id="billingAddressLine2"
                          {...register("billingAddressLine2")}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingCity">City *</Label>
                          <Input
                            id="billingCity"
                            {...register("billingCity")}
                          />
                          {errors.billingCity && (
                            <p className="text-sm text-red-500">
                              {errors.billingCity.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingState">State/Province</Label>
                          <Input
                            id="billingState"
                            {...register("billingState")}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingPostalCode">
                            Postal Code *
                          </Label>
                          <Input
                            id="billingPostalCode"
                            {...register("billingPostalCode")}
                          />
                          {errors.billingPostalCode && (
                            <p className="text-sm text-red-500">
                              {errors.billingPostalCode.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingCountry">Country *</Label>
                          <Controller
                            control={control}
                            name="billingCountry"
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="US">
                                    United States
                                  </SelectItem>
                                  <SelectItem value="CA">Canada</SelectItem>
                                  <SelectItem value="GB">
                                    United Kingdom
                                  </SelectItem>
                                  <SelectItem value="AU">Australia</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.billingCountry && (
                            <p className="text-sm text-red-500">
                              {errors.billingCountry.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {isLoggedIn && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            {...register("saveBillingAddress")}
                          />
                          <span className="text-sm">
                            Save this billing address for future orders
                          </span>
                        </label>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
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
                        <p className="font-medium">Free over LKR 100</p>
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
                        <p className="font-medium">LKR 19.99</p>
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
              {watch("contactPhone") && (
                <p className="text-muted-foreground">{watch("contactPhone")}</p>
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
              <p className="text-muted-foreground">
                {watch("shippingRecipientName")}
              </p>
              <p className="text-muted-foreground">{watch("shippingPhone")}</p>
              <p className="text-muted-foreground">
                {watch("shippingAddressLine1")}
                {watch("shippingAddressLine2") &&
                  `, ${watch("shippingAddressLine2")}`}
              </p>
              <p className="text-muted-foreground">
                {watch("shippingCity")}, {watch("shippingState")}{" "}
                {watch("shippingPostalCode")}
              </p>
              <p className="text-muted-foreground">
                {watch("shippingCountry")}
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <CheckSquare className="h-4 w-4" />
                Billing Address
              </h3>
              {watch("useShippingAsBilling") ? (
                <p className="text-muted-foreground">
                  Same as shipping address
                </p>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    {watch("billingRecipientName")}
                  </p>
                  <p className="text-muted-foreground">
                    {watch("billingPhone")}
                  </p>
                  <p className="text-muted-foreground">
                    {watch("billingAddressLine1")}
                    {watch("billingAddressLine2") &&
                      `, ${watch("billingAddressLine2")}`}
                  </p>
                  <p className="text-muted-foreground">
                    {watch("billingCity")}, {watch("billingState")}{" "}
                    {watch("billingPostalCode")}
                  </p>
                  <p className="text-muted-foreground">
                    {watch("billingCountry")}
                  </p>
                </>
              )}
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
