"use client"

import { useMemo, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CreditCard,
  Landmark,
  Loader2,
  MapPin,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { CheckoutSummary } from "@/components/storefront/checkout/checkout-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  submitCheckoutSession,
  updateCheckoutSession,
} from "@/lib/actions/checkout"
import {
  calculateCheckoutPricing,
  type CheckoutPaymentMethod,
  type CheckoutPricing,
  type CheckoutShippingMethod,
} from "@/lib/checkout/pricing"
import {
  type AddressForCheckout,
  type CheckoutSessionInput,
  checkoutSessionInputSchema,
  type CheckoutSummary as CheckoutSummaryType,
} from "@/lib/schemas/checkout"
import { cn } from "@/lib/utils"

interface CheckoutFormProps {
  sessionId: string
  addresses: AddressForCheckout[]
  isLoggedIn: boolean
  userEmail: string
  summary: CheckoutSummaryType
  initialPricing: CheckoutPricing
  defaultInput: Partial<CheckoutSessionInput>
}

export function CheckoutForm({
  sessionId,
  addresses,
  isLoggedIn,
  userEmail,
  summary,
  initialPricing,
  defaultInput,
}: CheckoutFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutSessionInput>({
    resolver: zodResolver(checkoutSessionInputSchema),
    defaultValues: {
      contact: {
        email: defaultInput.contact?.email || userEmail,
        phone: defaultInput.contact?.phone || "",
      },
      shippingAddress: {
        addressId: defaultInput.shippingAddress?.addressId,
        recipientName: defaultInput.shippingAddress?.recipientName || "",
        phone:
          defaultInput.shippingAddress?.phone ||
          defaultInput.contact?.phone ||
          "",
        addressLine1: defaultInput.shippingAddress?.addressLine1 || "",
        addressLine2: defaultInput.shippingAddress?.addressLine2 || "",
        city: defaultInput.shippingAddress?.city || "",
        district: defaultInput.shippingAddress?.district || "",
        postalCode: defaultInput.shippingAddress?.postalCode || "",
        country: defaultInput.shippingAddress?.country || "Sri Lanka",
        instructions: defaultInput.shippingAddress?.instructions || "",
        saveAddress: defaultInput.shippingAddress?.saveAddress || false,
      },
      shippingMethod: defaultInput.shippingMethod || "standard",
      paymentMethod: defaultInput.paymentMethod || "card",
      notes: defaultInput.notes || "",
    },
  })

  const shippingMethod = watch("shippingMethod") as CheckoutShippingMethod
  const paymentMethod = watch("paymentMethod") as CheckoutPaymentMethod

  const livePricing = useMemo(
    () =>
      calculateCheckoutPricing(summary.subtotal, shippingMethod, paymentMethod),
    [paymentMethod, shippingMethod, summary.subtotal],
  )

  const handleAddressSelect = (address: AddressForCheckout) => {
    setValue("shippingAddress.addressId", address.id)
    setValue("shippingAddress.recipientName", address.recipientName)
    setValue("shippingAddress.phone", address.phone)
    setValue("contact.phone", address.phone)
    setValue("shippingAddress.addressLine1", address.addressLine1)
    setValue("shippingAddress.addressLine2", address.addressLine2 || "")
    setValue("shippingAddress.city", address.city)
    setValue("shippingAddress.district", address.district || "")
    setValue("shippingAddress.postalCode", address.postalCode || "")
    setValue("shippingAddress.country", address.country)
  }

  const onSubmit = (data: CheckoutSessionInput) => {
    startTransition(async () => {
      const updateResult = await updateCheckoutSession(data)

      if (!updateResult.success) {
        toast.error("Unable to update checkout details")
        return
      }

      const result = await submitCheckoutSession(
        updateResult.sessionId || sessionId,
      )

      if (!result.success || !result.redirectUrl) {
        toast.error(result.error || "Unable to complete checkout")
        return
      }

      window.dispatchEvent(new Event("cart-updated"))

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
        return
      }

      router.push(result.redirectUrl)
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Secure checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your order will be priced and validated on the server before it is
            submitted. Card payments are charged in LKR, and bank transfer /
            cash on delivery instructions appear after order placement.
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                {...register("contact.email")}
                disabled={isLoggedIn}
              />
              {errors.contact?.email ? (
                <p className="text-sm text-destructive">
                  {errors.contact.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact-phone">Mobile number</Label>
              <Input
                id="contact-phone"
                placeholder="0771234567"
                {...register("contact.phone")}
              />
              {errors.contact?.phone ? (
                <p className="text-sm text-destructive">
                  {errors.contact.phone.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {addresses.length > 0 ? (
              <div className="grid gap-3">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => handleAddressSelect(address)}
                    className="rounded-xl border p-4 text-left transition-colors hover:border-primary/50"
                  >
                    <p className="font-medium">
                      {address.label || address.recipientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.addressLine1}, {address.city}
                      {address.district ? `, ${address.district}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="recipient-name">Recipient name</Label>
                <Input
                  id="recipient-name"
                  {...register("shippingAddress.recipientName")}
                />
                {errors.shippingAddress?.recipientName ? (
                  <p className="text-sm text-destructive">
                    {errors.shippingAddress.recipientName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="delivery-phone">Delivery phone</Label>
                <Input
                  id="delivery-phone"
                  {...register("shippingAddress.phone")}
                />
                {errors.shippingAddress?.phone ? (
                  <p className="text-sm text-destructive">
                    {errors.shippingAddress.phone.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address-line-1">Address line 1</Label>
                <Input
                  id="address-line-1"
                  {...register("shippingAddress.addressLine1")}
                />
                {errors.shippingAddress?.addressLine1 ? (
                  <p className="text-sm text-destructive">
                    {errors.shippingAddress.addressLine1.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address-line-2">Address line 2</Label>
                <Input
                  id="address-line-2"
                  {...register("shippingAddress.addressLine2")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("shippingAddress.city")} />
                {errors.shippingAddress?.city ? (
                  <p className="text-sm text-destructive">
                    {errors.shippingAddress.city.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  {...register("shippingAddress.district")}
                />
                {errors.shippingAddress?.district ? (
                  <p className="text-sm text-destructive">
                    {errors.shippingAddress.district.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal-code">Postal code</Label>
                <Input
                  id="postal-code"
                  {...register("shippingAddress.postalCode")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register("shippingAddress.country")}
                  disabled
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instructions">Delivery instructions</Label>
                <Textarea
                  id="instructions"
                  rows={3}
                  {...register("shippingAddress.instructions")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery method
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              {
                value: "standard" as const,
                title: "Standard delivery",
                description:
                  "Islandwide delivery with free shipping over LKR 5,000.",
              },
              {
                value: "express" as const,
                title: "Express delivery",
                description: "Priority processing for urgent orders.",
              },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                  shippingMethod === option.value
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/40",
                )}
              >
                <input
                  type="radio"
                  value={option.value}
                  className="mt-1"
                  {...register("shippingMethod")}
                />
                <div>
                  <p className="font-medium">{option.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment method
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              {
                value: "card" as const,
                title: "Card payment",
                description: "Pay online immediately with a card.",
                icon: CreditCard,
              },
              {
                value: "bank_transfer" as const,
                title: "Bank transfer",
                description: "Place the order, then upload payment proof.",
                icon: Landmark,
              },
              {
                value: "cash_on_delivery" as const,
                title: "Cash on delivery",
                description: "Pay at your doorstep. A COD service fee applies.",
                icon: Truck,
              },
            ].map((option) => {
              const Icon = option.icon

              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    paymentMethod === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="mt-1"
                    {...register("paymentMethod")}
                  />
                  <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{option.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Order notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={4}
              placeholder="Special delivery instructions or order notes"
              {...register("notes")}
            />
            {isLoggedIn ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  {...register("shippingAddress.saveAddress")}
                />
                Save this address to my account
              </label>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-2xl border bg-background px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Secure total</p>
            <p className="text-2xl font-semibold">
              {initialPricing.currency === livePricing.currency
                ? new Intl.NumberFormat("en-LK", {
                    style: "currency",
                    currency: livePricing.currency,
                  }).format(livePricing.total)
                : ""}
            </p>
          </div>
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : paymentMethod === "card" ? (
              "Continue to payment"
            ) : (
              "Place order"
            )}
          </Button>
        </div>
      </div>

      <CheckoutSummary
        summary={summary}
        pricing={livePricing}
        shippingMethod={shippingMethod}
        paymentMethod={paymentMethod}
      />
    </form>
  )
}
