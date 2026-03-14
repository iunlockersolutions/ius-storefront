import { z } from "zod"

import type {
  CheckoutPaymentMethod,
  CheckoutPricing,
  CheckoutShippingMethod,
} from "@/lib/checkout/pricing"

export const checkoutContactSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid Sri Lankan phone number")
    .max(20, "Phone number is too long"),
})

export const checkoutAddressSchema = z.object({
  addressId: z.string().uuid().optional(),
  recipientName: z.string().trim().min(2, "Recipient name is required"),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid Sri Lankan phone number")
    .max(20, "Phone number is too long"),
  addressLine1: z.string().trim().min(5, "Address is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  district: z.string().trim().min(2, "District is required"),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().default("Sri Lanka"),
  instructions: z.string().trim().max(500).optional(),
  saveAddress: z.boolean().optional(),
})

function normalizeDraftString(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

const draftEmailSchema = z.preprocess(
  normalizeDraftString,
  z.string().email("Enter a valid email address").optional(),
)

const draftShortTextSchema = z.preprocess(
  normalizeDraftString,
  z.string().optional(),
)

const draftPhoneSchema = z.preprocess(
  normalizeDraftString,
  z.string().max(20, "Phone number is too long").optional(),
)

const draftUuidSchema = z.preprocess(
  normalizeDraftString,
  z.string().uuid().optional(),
)

export const checkoutContactDraftSchema = z.object({
  email: draftEmailSchema,
  phone: draftPhoneSchema,
})

export const checkoutAddressDraftSchema = z.object({
  addressId: draftUuidSchema,
  recipientName: draftShortTextSchema,
  phone: draftPhoneSchema,
  addressLine1: draftShortTextSchema,
  addressLine2: draftShortTextSchema,
  city: draftShortTextSchema,
  district: draftShortTextSchema,
  postalCode: draftShortTextSchema,
  country: draftShortTextSchema,
  instructions: draftShortTextSchema,
  saveAddress: z.boolean().optional(),
})

export const checkoutSessionInputBaseSchema = z.object({
  accountIntent: z.enum(["guest", "signin", "create_account"]).default("guest"),
  contact: checkoutContactSchema,
  shippingAddress: checkoutAddressSchema,
  billingSameAsShipping: z.boolean().default(true),
  billingAddress: checkoutAddressSchema.optional(),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["card", "bank_transfer", "cash_on_delivery"]),
  notes: z.string().trim().max(1000).optional(),
})

export const checkoutSessionDraftSchema = z.object({
  accountIntent: z.enum(["guest", "signin", "create_account"]).optional(),
  contact: checkoutContactDraftSchema.optional(),
  shippingAddress: checkoutAddressDraftSchema.optional(),
  billingSameAsShipping: z.boolean().optional(),
  billingAddress: checkoutAddressDraftSchema.optional(),
  shippingMethod: z.enum(["standard", "express"]).optional(),
  paymentMethod: z
    .enum(["card", "bank_transfer", "cash_on_delivery"])
    .optional(),
  notes: z.string().trim().max(1000).optional(),
})

export const checkoutSessionInputSchema =
  checkoutSessionInputBaseSchema.superRefine((value, ctx) => {
    if (!value.billingSameAsShipping && !value.billingAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["billingAddress"],
        message: "Enter a billing address or use the shipping address",
      })
    }

    if (
      !value.billingSameAsShipping &&
      value.billingAddress &&
      value.billingAddress.recipientName.trim().length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["billingAddress", "recipientName"],
        message: "Recipient name is required",
      })
    }
  })

export type CheckoutSessionInput = z.infer<typeof checkoutSessionInputSchema>
export type CheckoutContactInput = z.infer<typeof checkoutContactSchema>
export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>

export interface AddressForCheckout {
  id: string
  type: string
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  district: string | null
  postalCode: string | null
  country: string
  isDefault: boolean
  label: string | null
}

export interface CheckoutCartLine {
  id: string
  quantity: number
  variantId: string
  variantName: string
  variantSku: string
  variantPrice: string
  productId: string
  productName: string
  productSlug: string
  productStatus: string
  manageInventory: boolean
  trackingMode: "quantity" | "serial" | null
  receiptIdentifierTypes: Array<"serial" | "imei" | "imei2" | "barcode">
  availableQuantity: number
}

export interface CartValidationResult {
  success: boolean
  cart?: {
    id: string
    items: CheckoutCartLine[]
    subtotal: number
    itemCount: number
  }
  errors?: string[]
}

export interface CheckoutSummary {
  items: Array<{
    id: string
    name: string
    variant: string
    sku: string
    price: number
    quantity: number
    image: string | null
  }>
  subtotal: number
  itemCount: number
}

export interface CheckoutPageData {
  sessionId: string
  isLoggedIn: boolean
  userEmail: string
  addresses: AddressForCheckout[]
  summary: CheckoutSummary
  pricing: CheckoutPricing
  defaultInput: Partial<CheckoutSessionInput>
}

export interface SubmitCheckoutResult {
  success: boolean
  redirectUrl?: string
  confirmationToken?: string
  paymentUrl?: string
  orderId?: string
  orderNumber?: string
  error?: string
}
