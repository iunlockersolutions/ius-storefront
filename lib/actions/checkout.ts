"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import { getServerSession } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  cartItems,
  carts,
  customerAddresses,
  customerProfiles,
  inventoryItems,
  inventoryMovements,
  orderItems,
  orders,
  orderStatusHistory,
} from "@/lib/db/schema"
import {
  type AddressForCheckout,
  calculateOrderTotals,
  type CartValidationResult,
  type CheckoutData,
  checkoutDataSchema,
  type CheckoutSummary,
  type CreateOrderResult,
} from "@/lib/schemas/checkout"

const CART_SESSION_COOKIE = "cart_session"

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
  const guestCartId = cookieStore.get(CART_SESSION_COOKIE)?.value

  // Find cart
  let cart
  if (session?.user?.id) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
    })
  } else if (guestCartId) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.id, guestCartId),
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
          inventory: true,
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

  for (const item of items) {
    const availableQuantity = item.variant.inventory
      ? item.variant.inventory.quantity -
        item.variant.inventory.reservedQuantity
      : 0

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
    if (availableQuantity < item.quantity) {
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
      productId: item.variant.product.id,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      productStatus: item.variant.product.status,
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

  // Prepare shipping address JSONB
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
          customerName: checkoutData.shipping.recipientName,
          status: "draft", // Initial status
          subtotal: cart.subtotal.toFixed(2),
          shippingCost: totals.shipping.toFixed(2),
          taxAmount: totals.tax.toFixed(2),
          discountAmount: "0.00",
          total: totals.total.toFixed(2),
          shippingAddress,
          billingAddress: shippingAddress, // Same for billing for now
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
          // Denormalized product data
          productName: item.productName,
          variantName: item.variantName,
          sku: item.variantSku,
        })

        // 3. Reserve inventory
        const [inventory] = await tx
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.variantId, item.variantId))
          .for("update")

        if (inventory) {
          const newReserved = inventory.reservedQuantity + item.quantity

          await tx
            .update(inventoryItems)
            .set({
              reservedQuantity: newReserved,
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, inventory.id))

          // Record inventory movement
          await tx.insert(inventoryMovements).values({
            inventoryItemId: inventory.id,
            type: "reserved",
            quantity: -item.quantity,
            previousQuantity: inventory.quantity - inventory.reservedQuantity,
            newQuantity: inventory.quantity - newReserved,
            referenceType: "order",
            referenceId: order.id,
            notes: `Reserved for order ${orderNumber}`,
          })
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

      // 5. Delete cart items (effectively marks cart as converted)
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id))

      // 6. Save address if requested and user is logged in
      if (
        session?.user?.id &&
        checkoutData.shipping.saveAddress &&
        !checkoutData.shipping.addressId
      ) {
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

        if (profile) {
          await tx.insert(customerAddresses).values({
            customerId: profile.id,
            type: "shipping",
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
      }

      return order
    })

    revalidatePath("/cart")
    revalidatePath("/orders")
    revalidatePath("/admin/orders")

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
  const guestCartId = cookieStore.get(CART_SESSION_COOKIE)?.value

  // Find cart
  let cart
  if (session?.user?.id) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
    })
  } else if (guestCartId) {
    cart = await db.query.carts.findFirst({
      where: eq(carts.id, guestCartId),
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
          product: {
            with: {
              images: {
                where: (images, { eq }) => eq(images.isPrimary, true),
                limit: 1,
              },
            },
          },
        },
      },
    },
  })

  if (items.length === 0) {
    return null
  }

  let subtotal = 0
  const formattedItems = items.map((item) => {
    const price = parseFloat(item.variant.price)
    subtotal += price * item.quantity

    return {
      id: item.id,
      name: item.variant.product.name,
      variant: item.variant.name,
      price,
      quantity: item.quantity,
      image: item.variant.product.images[0]?.url || null,
    }
  })

  return {
    items: formattedItems,
    subtotal,
    itemCount: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
  }
}
