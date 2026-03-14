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

export const checkoutSessionInputSchema = z.object({
  contact: checkoutContactSchema,
  shippingAddress: checkoutAddressSchema,
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["card", "bank_transfer", "cash_on_delivery"]),
  notes: z.string().trim().max(1000).optional(),
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
