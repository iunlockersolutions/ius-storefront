import { z } from "zod"

// ============================================
// Validation Schemas
// ============================================

export const contactInfoSchema = z.object({
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
})

export const shippingAddressSchema = z.object({
  addressId: z.string().optional(), // Use existing address
  recipientName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  instructions: z.string().optional(),
  saveAddress: z.boolean().optional(),
})

export const checkoutDataSchema = z.object({
  contact: contactInfoSchema,
  shipping: shippingAddressSchema,
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["card", "bank_transfer", "cod"]),
  notes: z.string().optional(),
})

export type CheckoutData = z.infer<typeof checkoutDataSchema>
export type ContactInfo = z.infer<typeof contactInfoSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>

// ============================================
// Checkout Interfaces
// ============================================

export interface AddressForCheckout {
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

export interface CartValidationResult {
  success: boolean
  cart?: {
    id: string
    items: Array<{
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
      availableQuantity: number
    }>
    subtotal: number
    itemCount: number
  }
  errors?: string[]
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export interface CreateOrderResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  error?: string
}

export interface CheckoutSummary {
  items: Array<{
    id: string
    name: string
    variant: string
    price: number
    quantity: number
    image: string | null
  }>
  subtotal: number
  itemCount: number
}

// ============================================
// Calculate Order Totals (Pure Function)
// ============================================

export function calculateOrderTotals(
  subtotal: number,
  shippingMethod: "standard" | "express",
): OrderTotals {
  // Free shipping over $100 for standard, express always $19.99
  const shipping =
    shippingMethod === "express" ? 19.99 : subtotal >= 100 ? 0 : 9.99

  // Estimate tax at 8%
  const tax = subtotal * 0.08

  return {
    subtotal,
    shipping,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((subtotal + shipping + tax) * 100) / 100,
  }
}
