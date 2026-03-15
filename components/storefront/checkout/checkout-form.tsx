"use client"

import { useMemo, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CreditCard,
  Landmark,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  UserRoundPlus,
} from "lucide-react"
import { toast } from "sonner"

import { CheckoutSummary } from "@/components/storefront/checkout/checkout-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  submitCheckoutSession,
  updateCheckoutSession,
} from "@/lib/actions/checkout"
import {
  calculateCheckoutPricing,
  type CheckoutPaymentMethod,
  type CheckoutShippingMethod,
} from "@/lib/checkout/pricing"
import {
  type AddressForCheckout,
  type CheckoutSessionInput,
  checkoutSessionInputSchema,
  type CheckoutSummary as CheckoutSummaryType,
} from "@/lib/schemas/checkout"
import { cn, formatCurrency } from "@/lib/utils"

interface CheckoutFormProps {
  sessionId: string
  addresses: AddressForCheckout[]
  isLoggedIn: boolean
  userEmail: string
  summary: CheckoutSummaryType
  defaultInput: Partial<CheckoutSessionInput>
}

function SectionError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function CheckoutForm({
  sessionId,
  addresses,
  isLoggedIn,
  userEmail,
  summary,
  defaultInput,
}: CheckoutFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutSessionInput>({
    resolver: zodResolver(checkoutSessionInputSchema),
    shouldUnregister: true,
    defaultValues: {
      accountIntent:
        defaultInput.accountIntent || (isLoggedIn ? "signin" : "guest"),
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
      billingSameAsShipping: defaultInput.billingSameAsShipping ?? true,
      billingAddress:
        defaultInput.billingSameAsShipping === false
          ? {
              recipientName: defaultInput.billingAddress?.recipientName || "",
              phone: defaultInput.billingAddress?.phone || "",
              addressLine1: defaultInput.billingAddress?.addressLine1 || "",
              addressLine2: defaultInput.billingAddress?.addressLine2 || "",
              city: defaultInput.billingAddress?.city || "",
              district: defaultInput.billingAddress?.district || "",
              postalCode: defaultInput.billingAddress?.postalCode || "",
              country: defaultInput.billingAddress?.country || "Sri Lanka",
              instructions: defaultInput.billingAddress?.instructions || "",
              saveAddress: false,
            }
          : undefined,
      shippingMethod: defaultInput.shippingMethod || "standard",
      paymentMethod: defaultInput.paymentMethod || "card",
      notes: defaultInput.notes || "",
    },
  })

  const accountIntent = useWatch({ control, name: "accountIntent" })
  const shippingMethod = useWatch({
    control,
    name: "shippingMethod",
  }) as CheckoutShippingMethod
  const paymentMethod = useWatch({
    control,
    name: "paymentMethod",
  }) as CheckoutPaymentMethod
  const billingSameAsShipping = useWatch({
    control,
    name: "billingSameAsShipping",
  })
  const saveShippingAddress =
    useWatch({
      control,
      name: "shippingAddress.saveAddress",
    }) || false

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
      try {
        const normalizedData = data.billingSameAsShipping
          ? {
              ...data,
              billingAddress: undefined,
            }
          : data

        const updateResult = await updateCheckoutSession(normalizedData)

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
        router.push(result.redirectUrl)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to complete checkout",
        )
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        const firstError = Object.values(formErrors)[0]

        toast.error(
          typeof firstError?.message === "string"
            ? firstError.message
            : "Please complete the required checkout fields",
        )
      })}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Secure one-page checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            We’ll validate pricing and sellable stock on the server before the
            order is submitted. Card payments use a dedicated mock payment page,
            and bank transfer / COD stay fully supported.
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={accountIntent}
              onValueChange={(value) =>
                setValue(
                  "accountIntent",
                  value as "guest" | "signin" | "create_account",
                )
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="guest">Guest</TabsTrigger>
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="create_account">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="guest" className="mt-4">
                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Continue as a guest. We’ll still send secure email links so
                  you can reopen and track the order later.
                </div>
              </TabsContent>
              <TabsContent value="signin" className="mt-4">
                {isLoggedIn ? (
                  <div className="rounded-xl border bg-emerald-50 p-4 text-sm text-emerald-900">
                    You’re signed in as {userEmail}. Saved addresses and order
                    history will stay connected to your account.
                  </div>
                ) : (
                  <div className="rounded-xl border p-4">
                    <div className="flex items-start gap-3">
                      <LogIn className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Sign in for saved addresses, faster checkout, and full
                          order history.
                        </p>
                        <Button variant="outline" asChild>
                          <Link href="/auth/login?callbackUrl=/checkout">
                            Sign in to continue
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="create_account" className="mt-4">
                <div className="rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <UserRoundPlus className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Create an account now or after checkout. If you use the
                        same email, we’ll connect eligible guest orders to your
                        account automatically.
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/auth/register?callbackUrl=/checkout">
                          Create account
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
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
              <SectionError message={errors.contact?.email?.message} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact-phone">Mobile number</Label>
              <Input
                id="contact-phone"
                placeholder="0771234567"
                {...register("contact.phone")}
              />
              <SectionError message={errors.contact?.phone?.message} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping address
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
                <Label htmlFor="ship-recipient-name">Recipient name</Label>
                <Input
                  id="ship-recipient-name"
                  {...register("shippingAddress.recipientName")}
                />
                <SectionError
                  message={errors.shippingAddress?.recipientName?.message}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ship-phone">Delivery phone</Label>
                <Input id="ship-phone" {...register("shippingAddress.phone")} />
                <SectionError
                  message={errors.shippingAddress?.phone?.message}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ship-address-1">Address line 1</Label>
                <Input
                  id="ship-address-1"
                  {...register("shippingAddress.addressLine1")}
                />
                <SectionError
                  message={errors.shippingAddress?.addressLine1?.message}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ship-address-2">Address line 2</Label>
                <Input
                  id="ship-address-2"
                  {...register("shippingAddress.addressLine2")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-city">City</Label>
                <Input id="ship-city" {...register("shippingAddress.city")} />
                <SectionError message={errors.shippingAddress?.city?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-district">District</Label>
                <Input
                  id="ship-district"
                  {...register("shippingAddress.district")}
                />
                <SectionError
                  message={errors.shippingAddress?.district?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-postal-code">Postal code</Label>
                <Input
                  id="ship-postal-code"
                  {...register("shippingAddress.postalCode")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-country">Country</Label>
                <Input
                  id="ship-country"
                  {...register("shippingAddress.country")}
                  disabled
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ship-instructions">Delivery instructions</Label>
                <Textarea
                  id="ship-instructions"
                  rows={3}
                  {...register("shippingAddress.instructions")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Billing address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Checkbox
                id="billing-same-as-shipping"
                checked={billingSameAsShipping}
                onCheckedChange={(checked) => {
                  const sameAsShipping = checked === true

                  setValue("billingSameAsShipping", sameAsShipping)

                  if (sameAsShipping) {
                    setValue("billingAddress", undefined)
                  }
                }}
              />
              <Label htmlFor="billing-same-as-shipping">
                Billing address is the same as shipping
              </Label>
            </div>

            {!billingSameAsShipping ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bill-recipient-name">Recipient name</Label>
                  <Input
                    id="bill-recipient-name"
                    {...register("billingAddress.recipientName")}
                  />
                  <SectionError
                    message={errors.billingAddress?.recipientName?.message}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bill-phone">Phone</Label>
                  <Input
                    id="bill-phone"
                    {...register("billingAddress.phone")}
                  />
                  <SectionError
                    message={errors.billingAddress?.phone?.message}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bill-address-1">Address line 1</Label>
                  <Input
                    id="bill-address-1"
                    {...register("billingAddress.addressLine1")}
                  />
                  <SectionError
                    message={errors.billingAddress?.addressLine1?.message}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bill-address-2">Address line 2</Label>
                  <Input
                    id="bill-address-2"
                    {...register("billingAddress.addressLine2")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bill-city">City</Label>
                  <Input id="bill-city" {...register("billingAddress.city")} />
                  <SectionError
                    message={errors.billingAddress?.city?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bill-district">District</Label>
                  <Input
                    id="bill-district"
                    {...register("billingAddress.district")}
                  />
                  <SectionError
                    message={errors.billingAddress?.district?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bill-postal-code">Postal code</Label>
                  <Input
                    id="bill-postal-code"
                    {...register("billingAddress.postalCode")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bill-country">Country</Label>
                  <Input
                    id="bill-country"
                    {...register("billingAddress.country")}
                    disabled
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={shippingMethod}
              onValueChange={(value) =>
                setValue("shippingMethod", value as CheckoutShippingMethod)
              }
            >
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
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValue("shippingMethod", option.value, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    shippingMethod === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40",
                  )}
                >
                  <RadioGroupItem
                    id={`shipping-method-${option.value}`}
                    value={option.value}
                    className="mt-1"
                  />
                  <div>
                    <Label
                      htmlFor={`shipping-method-${option.value}`}
                      className="font-medium"
                    >
                      {option.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setValue("paymentMethod", value as CheckoutPaymentMethod)
              }
            >
              {[
                {
                  value: "card" as const,
                  title: "Card payment",
                  description:
                    "Redirect to a secure mock card page to complete payment.",
                  icon: CreditCard,
                },
                {
                  value: "bank_transfer" as const,
                  title: "Bank transfer",
                  description:
                    "Place the order, then follow bank deposit instructions and upload proof.",
                  icon: Landmark,
                },
                {
                  value: "cash_on_delivery" as const,
                  title: "Cash on delivery",
                  description:
                    "Pay when the order arrives. A COD fee is included in the total.",
                  icon: Truck,
                },
              ].map((option) => {
                const Icon = option.icon

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue("paymentMethod", option.value, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      paymentMethod === option.value
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40",
                    )}
                  >
                    <RadioGroupItem
                      id={`payment-method-${option.value}`}
                      value={option.value}
                      className="mt-1"
                    />
                    <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label
                        htmlFor={`payment-method-${option.value}`}
                        className="font-medium"
                      >
                        {option.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </RadioGroup>
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
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Checkbox
                  id="save-shipping-address"
                  checked={saveShippingAddress}
                  onCheckedChange={(checked) =>
                    setValue("shippingAddress.saveAddress", checked === true)
                  }
                />
                <Label htmlFor="save-shipping-address">
                  Save this shipping address to my account
                </Label>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-2xl border bg-background px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Secure total</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(livePricing.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              Prices are charged in LKR and revalidated before order placement.
            </p>
          </div>
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : paymentMethod === "card" ? (
              "Continue to mock payment"
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
