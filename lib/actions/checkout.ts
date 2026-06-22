"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import {
  getVariantInventoryAvailabilityMap,
  reserveInventory,
} from "@/lib/actions/inventory"
import { getServerSession } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  cartItems,
  carts,
  customerAddresses,
  customerProfiles,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
} from "@/lib/db/schema"
import { serverEnv } from "@/lib/env"
import {
  getPrimaryProductImageMap,
  getVariantSpecificProductImageMap,
} from "@/lib/media/service"
import {
  type AddressForCheckout,
  calculateOrderTotals,
  type CartValidationResult,
  type CheckoutData,
  checkoutDataSchema,
  type CheckoutSummary,
  type CreateOrderResult,
} from "@/lib/schemas/checkout"

const CART_SESSION_COOKIE = "cart_session_id"

function getOrderHoldExpiresAt() {
  return new Date(Date.now() + serverEnv.ORDER_HOLD_TIMEOUT_MINUTES * 60_000)
}

function generateBankTransferReference(orderNumber: string) {
  const compactOrderNumber = orderNumber.replace(/[^A-Za-z0-9]/g, "")
  return `BT-${compactOrderNumber.slice(-8).toUpperCase()}-${nanoid(4).toUpperCase()}`
}

// ============================================
// Get User Addresses
// ============================================

export async function getUserAddresses(): Promise<AddressForCheckout[]> {
  const session = await getServerSession()

  if (!session?.user?.id) {
    return []
  }

  // First get the customer profile
  const profile = await db.query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, session.user.id),
  })

  if (!profile) {
    return []
  }

  const addresses = await db.query.customerAddresses.findMany({
    where: eq(customerAddresses.customerId, profile.id),
    orderBy: (addresses, { desc }) => [desc(addresses.isDefault)],
  })

  return addresses.map((addr) => ({
    id: addr.id,
    type: addr.type,
    recipientName: addr.recipientName,
    phone: addr.phone,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    isDefault: addr.isDefault,
    label: addr.label,
  }))
}

// ============================================
// Validate Cart for Checkout
// ============================================

export async function validateCartForCheckout(): Promise<CartValidationResult> {
  const session = await getServerSession()
  const cookieStore = await cookies()
  const guestCartSessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

  // Find cart
  let cart
  if (session?.user?.id) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
    })
  } else if (guestCartSessionId) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, guestCartSessionId),
    })
  }

  if (!cart) {
    return { success: false, errors: ["Cart not found"] }
  }

  // Get cart items with variant data
  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cart.id),
    with: {
      variant: {
        with: {
          product: true,
        },
      },
    },
  })

  if (items.length === 0) {
    return { success: false, errors: ["Cart is empty"] }
  }

  const errors: string[] = []
  const validatedItems = []
  let subtotal = 0
  const availabilityByVariant = await getVariantInventoryAvailabilityMap(
    items.map((item) => item.variant.id),
  )
  const quantityByVariant = new Map<string, number>()

  for (const item of items) {
    quantityByVariant.set(
      item.variant.id,
      (quantityByVariant.get(item.variant.id) ?? 0) + item.quantity,
    )
  }

  for (const item of items) {
    const availability = availabilityByVariant.get(item.variant.id)
    const managesInventory = availability?.manageInventory ?? false
    const availableQuantity = managesInventory
      ? (availability?.sellableQuantity ?? 0)
      : Number.MAX_SAFE_INTEGER

    // Check if product is still active
    if (item.variant.product.status !== "active") {
      errors.push(`${item.variant.product.name} is no longer available`)
      continue
    }

    // Check if variant is active
    if (!item.variant.isActive) {
      errors.push(`${item.variant.name} is no longer available`)
      continue
    }

    // Check stock
    const requestedVariantQuantity =
      quantityByVariant.get(item.variant.id) ?? item.quantity

    if (availableQuantity < requestedVariantQuantity) {
      if (availableQuantity === 0) {
        errors.push(
          `${item.variant.product.name} (${item.variant.name}) is out of stock`,
        )
      } else {
        errors.push(
          `${item.variant.product.name} (${item.variant.name}): only ${availableQuantity} available`,
        )
      }
    }

    const price = parseFloat(item.variant.price)
    subtotal += price * item.quantity

    validatedItems.push({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variant.id,
      variantName: item.variant.name,
      variantSku: item.variant.sku,
      variantPrice: item.variant.price,
      nonPricingSelections: item.nonPricingSelections,
      productId: item.variant.product.id,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      productStatus: item.variant.product.status,
      manageInventory: managesInventory,
      availableQuantity,
    })
  }

  return {
    success: errors.length === 0,
    cart: {
      id: cart.id,
      items: validatedItems,
      subtotal,
      itemCount: validatedItems.reduce((sum, item) => sum + item.quantity, 0),
    },
    errors: errors.length > 0 ? errors : undefined,
  }
}

// ============================================
// Create Order
// ============================================

export async function createOrder(
  checkoutData: CheckoutData,
): Promise<CreateOrderResult> {
  // Validate checkout data
  const validation = checkoutDataSchema.safeParse(checkoutData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid checkout data",
    }
  }

  // Validate cart
  const cartValidation = await validateCartForCheckout()
  if (!cartValidation.success || !cartValidation.cart) {
    return {
      success: false,
      error: cartValidation.errors?.[0] || "Cart validation failed",
    }
  }

  const session = await getServerSession()
  const cart = cartValidation.cart
  const totals = calculateOrderTotals(
    cart.subtotal,
    checkoutData.shippingMethod,
  )

  // Generate order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`

  const shippingAddress = {
    recipientName: checkoutData.shipping.recipientName,
    phone: checkoutData.shipping.phone,
    addressLine1: checkoutData.shipping.addressLine1,
    addressLine2: checkoutData.shipping.addressLine2,
    city: checkoutData.shipping.city,
    state: checkoutData.shipping.state,
    postalCode: checkoutData.shipping.postalCode,
    country: checkoutData.shipping.country,
    instructions: checkoutData.shipping.instructions,
  }

  const billingAddress = checkoutData.useShippingAsBilling
    ? {
        recipientName: shippingAddress.recipientName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      }
    : {
        recipientName: checkoutData.billing.recipientName,
        phone: checkoutData.billing.phone,
        addressLine1: checkoutData.billing.addressLine1,
        addressLine2: checkoutData.billing.addressLine2,
        city: checkoutData.billing.city,
        state: checkoutData.billing.state,
        postalCode: checkoutData.billing.postalCode,
        country: checkoutData.billing.country,
      }

  try {
    // Create order in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create order
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: session?.user?.id || null,
          customerEmail: checkoutData.contact.email,
          customerPhone: checkoutData.contact.phone || null,
          customerName: shippingAddress.recipientName,
          status: "draft", // Initial status
          subtotal: cart.subtotal.toFixed(2),
          shippingCost: totals.shipping.toFixed(2),
          taxAmount: totals.tax.toFixed(2),
          discountAmount: "0.00",
          total: totals.total.toFixed(2),
          shippingAddress,
          billingAddress,
          holdExpiresAt: getOrderHoldExpiresAt(),
          notes: checkoutData.notes || null,
        })
        .returning()

      // 2. Create order items
      for (const item of cart.items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.variantPrice,
          subtotal: (parseFloat(item.variantPrice) * item.quantity).toFixed(2),
          nonPricingSelections: item.nonPricingSelections,
          // Denormalized product data
          productName: item.productName,
          variantName: item.variantName,
          sku: item.variantSku,
        })

        if (item.manageInventory) {
          await reserveInventory(
            {
              variantId: item.variantId,
              quantity: item.quantity,
              referenceType: "order",
              referenceId: order.id,
              notes: `Reserved for order ${orderNumber}`,
            },
            { tx },
          )
        }
      }

      // 4. Add order status history
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: null,
        toStatus: "draft",
        notes: "Order placed",
        changedBy: session?.user?.id || null,
      })

      // 5. Apply payment-method specific transition and payment record
      if (checkoutData.paymentMethod === "card") {
        await tx.insert(payments).values({
          orderId: order.id,
          method: "card",
          status: "completed",
          amount: order.total,
          currency: "LKR",
          idempotencyKey: `card_${order.id}_${Date.now()}`,
          metadata: JSON.stringify({
            mode: "immediate_success",
          }),
          processedAt: new Date(),
        })

        await tx
          .update(orders)
          .set({
            status: "paid",
            holdExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id))

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          fromStatus: "draft",
          toStatus: "paid",
          notes: "Card payment completed",
          changedBy: session?.user?.id || null,
        })
      } else if (checkoutData.paymentMethod === "bank_transfer") {
        const bankTransferReference = generateBankTransferReference(
          order.orderNumber,
        )

        await tx.insert(payments).values({
          orderId: order.id,
          method: "bank_transfer",
          status: "pending",
          amount: order.total,
          currency: "LKR",
          idempotencyKey: `bt_${order.id}_${Date.now()}`,
          metadata: JSON.stringify({
            bankTransferReference,
          }),
        })

        await tx
          .update(orders)
          .set({
            status: "pending_payment",
            bankTransferReference,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id))

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          fromStatus: "draft",
          toStatus: "pending_payment",
          notes: `Bank transfer initiated. Reference: ${bankTransferReference}`,
          changedBy: session?.user?.id || null,
        })
      } else {
        await tx.insert(payments).values({
          orderId: order.id,
          method: "cash_on_delivery",
          status: "pending",
          amount: order.total,
          currency: "LKR",
          idempotencyKey: `cod_${order.id}_${Date.now()}`,
        })

        await tx
          .update(orders)
          .set({
            status: "processing",
            holdExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id))

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          fromStatus: "draft",
          toStatus: "processing",
          notes: "Cash on Delivery order moved to processing",
          changedBy: session?.user?.id || null,
        })
      }

      // 6. Delete cart items (effectively marks cart as converted)
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id))

      // 7. Save address if requested and user is logged in
      if (session?.user?.id) {
        // Get or create customer profile
        let profile = await tx.query.customerProfiles.findFirst({
          where: eq(customerProfiles.userId, session.user.id),
        })

        if (!profile) {
          const [newProfile] = await tx
            .insert(customerProfiles)
            .values({
              userId: session.user.id,
              phone: checkoutData.shipping.phone,
            })
            .returning()
          profile = newProfile
        }

        if (
          profile &&
          checkoutData.shipping.saveAddress &&
          !checkoutData.shipping.addressId
        ) {
          const shippingType = checkoutData.useShippingAsBilling
            ? "both"
            : "shipping"

          await tx.insert(customerAddresses).values({
            customerId: profile.id,
            type: shippingType,
            recipientName: checkoutData.shipping.recipientName,
            phone: checkoutData.shipping.phone,
            addressLine1: checkoutData.shipping.addressLine1,
            addressLine2: checkoutData.shipping.addressLine2 || null,
            city: checkoutData.shipping.city,
            state: checkoutData.shipping.state || null,
            postalCode: checkoutData.shipping.postalCode,
            country: checkoutData.shipping.country,
            instructions: checkoutData.shipping.instructions || null,
            isDefault: false,
          })
        }

        if (
          profile &&
          !checkoutData.useShippingAsBilling &&
          checkoutData.billing.saveAddress &&
          !checkoutData.billing.addressId
        ) {
          await tx.insert(customerAddresses).values({
            customerId: profile.id,
            type: "billing",
            recipientName: checkoutData.billing.recipientName,
            phone: checkoutData.billing.phone,
            addressLine1: checkoutData.billing.addressLine1,
            addressLine2: checkoutData.billing.addressLine2 || null,
            city: checkoutData.billing.city,
            state: checkoutData.billing.state || null,
            postalCode: checkoutData.billing.postalCode,
            country: checkoutData.billing.country,
            isDefault: false,
          })
        }
      }

      return order
    })

    revalidatePath("/cart")
    revalidatePath("/orders")
    revalidatePath("/ops/orders")

    return {
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
    }
  } catch (error) {
    console.error("Failed to create order:", error)
    return {
      success: false,
      error: "Failed to create order. Please try again.",
    }
  }
}

// ============================================
// Get Checkout Summary
// ============================================

export async function getCheckoutSummary(): Promise<CheckoutSummary | null> {
  const session = await getServerSession()
  const cookieStore = await cookies()
  const guestCartSessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

  // Find cart
  let cart
  if (session?.user?.id) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
    })
  } else if (guestCartSessionId) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, guestCartSessionId),
    })
  }

  if (!cart) {
    return null
  }

  // Get cart items with variant and product data
  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cart.id),
    with: {
      variant: {
        with: {
          product: true,
        },
      },
    },
  })

  if (items.length === 0) {
    return null
  }

  const imageMap = await getPrimaryProductImageMap(
    items.map((item) => item.variant.product.id),
  )
  const variantImageMap = await getVariantSpecificProductImageMap(
    items.map((item) => item.variant.id),
  )

  let subtotal = 0
  const formattedItems = items.map((item) => {
    const price = parseFloat(item.variant.price)
    subtotal += price * item.quantity

    return {
      id: item.id,
      name: item.variant.product.name,
      variant: item.variant.name,
      nonPricingSelections: item.nonPricingSelections,
      price,
      quantity: item.quantity,
      image:
        variantImageMap.get(item.variant.id) ||
        imageMap.get(item.variant.product.id) ||
        null,
    }
  })

  return {
    items: formattedItems,
    subtotal,
    itemCount: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
  }
}
