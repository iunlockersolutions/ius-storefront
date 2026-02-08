"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { headers } from "next/headers"

import { and, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  cartItems,
  carts,
  inventoryItems,
  products,
  productVariants,
} from "@/lib/db/schema"

const CART_SESSION_COOKIE = "cart_session_id"
const CART_SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Get or create a cart session ID for guests
 */
async function getCartSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

  if (!sessionId) {
    sessionId = nanoid(32)
    cookieStore.set(CART_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CART_SESSION_EXPIRY / 1000,
      path: "/",
    })
  }

  return sessionId
}

/**
 * Get or create a cart for the current user/session
 */
export async function getOrCreateCart() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const userId = session?.user?.id
  const sessionId = userId ? null : await getCartSessionId()

  // Try to find existing cart
  let cart
  if (userId) {
    ;[cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1)
  } else if (sessionId) {
    ;[cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1)
  }

  // Create new cart if not found
  if (!cart) {
    const expiresAt = new Date(Date.now() + CART_SESSION_EXPIRY)
    ;[cart] = await db
      .insert(carts)
      .values({
        userId: userId || null,
        sessionId: sessionId || null,
        expiresAt,
      })
      .returning()
  }

  return cart
}

/**
 * Get cart with items and product details
 */
export async function getCart() {
  const cart = await getOrCreateCart()

  const items = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      priceAtAdd: cartItems.priceAtAdd,
      variant: {
        id: productVariants.id,
        name: productVariants.name,
        sku: productVariants.sku,
        price: productVariants.price,
      },
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        status: products.status,
      },
      inventory: {
        quantity: inventoryItems.quantity,
      },
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cart.id))

  // Get primary image for each product
  const itemsWithImages = await Promise.all(
    items.map(async (item) => {
      const [image] = await db
        .select({ url: sql<string>`url` })
        .from(sql`product_images`)
        .where(
          and(eq(sql`product_id`, item.product.id), eq(sql`is_primary`, true)),
        )
        .limit(1)

      return {
        ...item,
        image: image?.url || null,
      }
    }),
  )

  // Calculate totals
  const subtotal = itemsWithImages.reduce((sum, item) => {
    return sum + parseFloat(item.variant.price) * item.quantity
  }, 0)

  const itemCount = itemsWithImages.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  return {
    id: cart.id,
    items: itemsWithImages,
    itemCount,
    subtotal,
  }
}

/**
 * Add item to cart
 */
export async function addToCart(variantId: string, quantity: number = 1) {
  try {
    const cart = await getOrCreateCart()

    // Get variant with product and inventory
    const [variant] = await db
      .select({
        id: productVariants.id,
        price: productVariants.price,
        isActive: productVariants.isActive,
        product: {
          id: products.id,
          status: products.status,
        },
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, variantId))
      .limit(1)

    if (!variant) {
      return { success: false as const, error: "Product not found" }
    }

    if (!variant.isActive || variant.product.status !== "active") {
      return { success: false as const, error: "Product is not available" }
    }

    // Check stock
    const [inventory] = await db
      .select({ quantity: inventoryItems.quantity })
      .from(inventoryItems)
      .where(eq(inventoryItems.variantId, variantId))
      .limit(1)

    const availableStock = inventory?.quantity || 0

    // Check existing cart item
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)),
      )
      .limit(1)

    const currentQuantity = existingItem?.quantity || 0
    const newQuantity = currentQuantity + quantity

    if (newQuantity > availableStock) {
      return {
        success: false as const,
        error: `Only ${availableStock} items available in stock`,
      }
    }

    if (existingItem) {
      // Update quantity
      await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId: cart.id,
        variantId,
        quantity,
        priceAtAdd: variant.price,
      })
    }

    revalidatePath("/cart")
    return { success: true as const }
  } catch (error) {
    console.error("Failed to add to cart:", error)
    return { success: false as const, error: "Failed to add item to cart" }
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    const cart = await getOrCreateCart()

    // Get the cart item
    const [item] = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        variantId: cartItems.variantId,
      })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1)

    if (!item) {
      return { success: false as const, error: "Item not found in cart" }
    }

    if (quantity <= 0) {
      // Remove item
      await db.delete(cartItems).where(eq(cartItems.id, itemId))
    } else {
      // Check stock
      const [inventory] = await db
        .select({ quantity: inventoryItems.quantity })
        .from(inventoryItems)
        .where(eq(inventoryItems.variantId, item.variantId))
        .limit(1)

      const availableStock = inventory?.quantity || 0

      if (quantity > availableStock) {
        return {
          success: false as const,
          error: `Only ${availableStock} items available in stock`,
        }
      }

      await db
        .update(cartItems)
        .set({
          quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, itemId))
    }

    revalidatePath("/cart")
    return { success: true as const }
  } catch (error) {
    console.error("Failed to update cart item:", error)
    return { success: false as const, error: "Failed to update cart" }
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string) {
  try {
    const cart = await getOrCreateCart()

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))

    revalidatePath("/cart")
    return { success: true as const }
  } catch (error) {
    console.error("Failed to remove from cart:", error)
    return { success: false as const, error: "Failed to remove item from cart" }
  }
}

/**
 * Clear cart
 */
export async function clearCart() {
  try {
    const cart = await getOrCreateCart()

    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))

    revalidatePath("/cart")
    return { success: true as const }
  } catch (error) {
    console.error("Failed to clear cart:", error)
    return { success: false as const, error: "Failed to clear cart" }
  }
}

/**
 * Merge guest cart into user cart on login
 */
export async function mergeCartsOnLogin(userId: string) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

    if (!sessionId) return

    // Find guest cart
    const [guestCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1)

    if (!guestCart) return

    // Find or create user cart
    let [userCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1)

    if (!userCart) {
      ;[userCart] = await db
        .insert(carts)
        .values({
          userId,
          expiresAt: new Date(Date.now() + CART_SESSION_EXPIRY),
        })
        .returning()
    }

    // Get guest cart items
    const guestItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id))

    // Merge items
    for (const item of guestItems) {
      const [existingItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCart.id),
            eq(cartItems.variantId, item.variantId),
          ),
        )
        .limit(1)

      if (existingItem) {
        // Add quantities
        await db
          .update(cartItems)
          .set({
            quantity: existingItem.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existingItem.id))
      } else {
        // Move item to user cart
        await db.insert(cartItems).values({
          cartId: userCart.id,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
        })
      }
    }

    // Delete guest cart (items cascade)
    await db.delete(carts).where(eq(carts.id, guestCart.id))

    // Clear session cookie
    cookieStore.delete(CART_SESSION_COOKIE)

    revalidatePath("/cart")
  } catch (error) {
    console.error("Failed to merge carts:", error)
  }
}

/**
 * Get cart count (for header badge)
 */
export async function getCartCount(): Promise<number> {
  try {
    const cart = await getOrCreateCart()

    const [result] = await db
      .select({
        count: sql<number>`COALESCE(SUM(${cartItems.quantity}), 0)`,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id))

    return Number(result?.count || 0)
  } catch {
    return 0
  }
}
