"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import crypto from "crypto"
import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import { getCart, getOrCreateCart } from "@/lib/actions/cart"
import {
  getVariantInventoryAvailabilityMap,
  reserveInventory,
} from "@/lib/actions/inventory"
import {
  initiateCardPayment,
  recordBankTransferPayment,
  recordCODPayment,
} from "@/lib/actions/payment"
import { getServerSession } from "@/lib/auth/rbac"
import {
  calculateCheckoutPricing,
  type CheckoutPaymentMethod,
  type CheckoutPricing,
  type CheckoutShippingMethod,
  resolveCheckoutPricingConfig,
} from "@/lib/checkout/pricing"
import { db } from "@/lib/db"
import {
  cartItems,
  carts,
  checkoutSessions,
  customerAddresses,
  customerProfiles,
  guestOrderAccessTokens,
  orderItems,
  orders,
  orderStatusHistory,
  siteSettings,
} from "@/lib/db/schema"
import { sendPlacedOrderEmails } from "@/lib/email/customer-order-email-service"
import {
  getPrimaryProductImageMap,
  getVariantSpecificProductImageMap,
} from "@/lib/media/service"
import { resolveBankTransferDetails } from "@/lib/payments/bank-transfer-details"
import {
  type AddressForCheckout,
  type CartValidationResult,
  type CheckoutPageData,
  checkoutSessionDraftSchema,
  type CheckoutSessionInput,
  checkoutSessionInputSchema,
  type CheckoutSummary,
  type SubmitCheckoutResult,
} from "@/lib/schemas/checkout"

const CART_SESSION_COOKIE = "cart_session_id"
const CHECKOUT_SESSION_TTL_MS = 24 * 60 * 60 * 1000
const ORDER_ACCESS_TOKEN_TTL_MS = 72 * 60 * 60 * 1000

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function buildAbsoluteUrl(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  return new URL(path, siteUrl).toString()
}

function toMoneyString(amount: number) {
  return amount.toFixed(2)
}

function normalizeDraftContact(
  contact?: {
    email?: string
    phone?: string
  } | null,
) {
  if (!contact?.email || !contact.phone) {
    return null
  }

  return {
    email: contact.email,
    phone: contact.phone,
  }
}

function normalizeDraftAddress(
  address?: {
    recipientName?: string
    phone?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    district?: string
    postalCode?: string
    country?: string
    instructions?: string
  } | null,
) {
  if (
    !address?.recipientName ||
    !address.phone ||
    !address.addressLine1 ||
    !address.city ||
    !address.district
  ) {
    return null
  }

  return {
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    district: address.district,
    postalCode: address.postalCode,
    country: address.country || "Sri Lanka",
    instructions: address.instructions,
  }
}

async function getSettingsMap() {
  const settings = await db.select().from(siteSettings)
  return Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value]),
  )
}

export async function getCartCheckoutPreviewPricing() {
  const settings = await getSettingsMap()
  const cart = await getCheckoutCart()

  if (!cart.cart) {
    return null
  }

  const validation = await validateCartForCheckout()
  if (!validation.success || !validation.cart) {
    return null
  }

  return calculateCheckoutPricing(
    validation.cart.subtotal,
    "standard",
    "card",
    resolveCheckoutPricingConfig(settings),
  )
}

export async function getConfiguredBankTransferDetails() {
  const settings = await getSettingsMap()
  return resolveBankTransferDetails(settings)
}

async function getCheckoutActor() {
  const session = await getServerSession()
  const cookieStore = await cookies()
  const cartSessionId = cookieStore.get(CART_SESSION_COOKIE)?.value ?? null

  return {
    session,
    userId: session?.user?.id ?? null,
    cartSessionId,
  }
}

async function getCheckoutCart() {
  const actor = await getCheckoutActor()
  const cart = await getOrCreateCart()

  return {
    ...actor,
    cart,
  }
}

export async function getUserAddresses(): Promise<AddressForCheckout[]> {
  const session = await getServerSession()

  if (!session?.user?.id) {
    return []
  }

  const profile = await db.query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, session.user.id),
  })

  if (!profile) {
    return []
  }

  const addresses = await db.query.customerAddresses.findMany({
    where: eq(customerAddresses.customerId, profile.id),
    orderBy: (addressTable, { desc }) => [desc(addressTable.isDefault)],
  })

  return addresses.map((address) => ({
    id: address.id,
    type: address.type,
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    district: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    label: address.label,
  }))
}

export async function validateCartForCheckout(): Promise<CartValidationResult> {
  const { cart } = await getCheckoutCart()

  if (!cart) {
    return { success: false, errors: ["Cart not found"] }
  }

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

  const availabilityByVariant = await getVariantInventoryAvailabilityMap(
    items.map((item) => item.variant.id),
  )

  const errors: string[] = []
  let subtotal = 0
  const validatedItems = items.flatMap((item) => {
    const availability = availabilityByVariant.get(item.variant.id)
    const manageInventory = availability?.manageInventory ?? false
    const availableQuantity = manageInventory
      ? (availability?.availableToSell ?? availability?.availableQuantity ?? 0)
      : Number.MAX_SAFE_INTEGER

    if (item.variant.product.status !== "active") {
      errors.push(`${item.variant.product.name} is no longer available`)
      return []
    }

    if (!item.variant.isActive) {
      errors.push(`${item.variant.name} is no longer available`)
      return []
    }

    if (availableQuantity < item.quantity) {
      errors.push(
        availableQuantity === 0
          ? `${item.variant.product.name} (${item.variant.name}) is out of stock`
          : `${item.variant.product.name} (${item.variant.name}): only ${availableQuantity} available`,
      )
      return []
    }

    const price = Number.parseFloat(item.variant.price)
    subtotal += price * item.quantity

    return [
      {
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
        manageInventory,
        trackingMode: availability?.trackingMode ?? null,
        receiptIdentifierTypes: item.variant.product.receiptIdentifierTypes,
        availableQuantity,
      },
    ]
  })

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

async function buildCheckoutSummary(): Promise<CheckoutSummary | null> {
  const cartValidation = await validateCartForCheckout()

  if (!cartValidation.success || !cartValidation.cart) {
    return null
  }

  const imageMap = await getPrimaryProductImageMap(
    cartValidation.cart.items.map((item) => item.productId),
  )
  const variantImageMap = await getVariantSpecificProductImageMap(
    cartValidation.cart.items.map((item) => item.variantId),
  )

  return {
    items: cartValidation.cart.items.map((item) => ({
      id: item.id,
      name: item.productName,
      variant: item.variantName,
      sku: item.variantSku,
      price: Number.parseFloat(item.variantPrice),
      quantity: item.quantity,
      image:
        variantImageMap.get(item.variantId) ||
        imageMap.get(item.productId) ||
        null,
    })),
    subtotal: cartValidation.cart.subtotal,
    itemCount: cartValidation.cart.itemCount,
  }
}

export async function getCheckoutSummary() {
  return buildCheckoutSummary()
}

async function upsertCheckoutSession(
  input?: Partial<CheckoutSessionInput>,
  pricingOverride?: CheckoutPricing,
) {
  const [{ settings, actor, cartValidation, addresses }, summary] =
    await Promise.all([
      Promise.all([
        getSettingsMap(),
        getCheckoutCart(),
        validateCartForCheckout(),
        getUserAddresses(),
      ]).then(([settings, actor, cartValidation, addresses]) => ({
        settings,
        actor,
        cartValidation,
        addresses,
      })),
      buildCheckoutSummary(),
    ])

  if (!actor.cart) {
    throw new Error("Cart not found")
  }

  if (!cartValidation.success || !cartValidation.cart || !summary) {
    throw new Error(cartValidation.errors?.[0] || "Cart is empty")
  }

  const existingSession = await db.query.checkoutSessions.findFirst({
    where: and(
      eq(checkoutSessions.cartId, actor.cart.id),
      eq(checkoutSessions.status, "open"),
    ),
  })

  const defaultAddress =
    addresses.find((address) => address.isDefault) ?? addresses[0]
  const nextInput: Partial<CheckoutSessionInput> = {
    accountIntent:
      (existingSession?.accountIntent as
        | "guest"
        | "signin"
        | "create_account"
        | null) ?? (actor.userId ? "signin" : "guest"),
    contact: existingSession?.contact
      ? {
          email: existingSession.contact.email,
          phone: existingSession.contact.phone,
        }
      : {
          email: actor.session?.user?.email ?? "",
          phone: defaultAddress?.phone ?? "",
        },
    shippingAddress: existingSession?.shippingAddress
      ? {
          recipientName: existingSession.shippingAddress.recipientName,
          phone: existingSession.shippingAddress.phone,
          addressLine1: existingSession.shippingAddress.addressLine1,
          addressLine2: existingSession.shippingAddress.addressLine2,
          city: existingSession.shippingAddress.city,
          district: existingSession.shippingAddress.district || "",
          postalCode: existingSession.shippingAddress.postalCode,
          country: existingSession.shippingAddress.country,
          instructions: existingSession.shippingAddress.instructions,
          saveAddress: false,
        }
      : defaultAddress
        ? {
            addressId: defaultAddress.id,
            recipientName: defaultAddress.recipientName,
            phone: defaultAddress.phone,
            addressLine1: defaultAddress.addressLine1,
            addressLine2: defaultAddress.addressLine2 ?? undefined,
            city: defaultAddress.city,
            district: defaultAddress.district || "",
            postalCode: defaultAddress.postalCode ?? undefined,
            country: defaultAddress.country,
            instructions: undefined,
            saveAddress: false,
          }
        : {
            recipientName: "",
            phone: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            district: "",
            postalCode: "",
            country: "Sri Lanka",
            instructions: "",
            saveAddress: false,
          },
    shippingMethod:
      existingSession?.shippingMethod === "express" ? "express" : "standard",
    billingSameAsShipping: existingSession?.billingSameAsShipping ?? true,
    billingAddress: existingSession?.billingAddress
      ? {
          recipientName: existingSession.billingAddress.recipientName,
          phone: existingSession.billingAddress.phone,
          addressLine1: existingSession.billingAddress.addressLine1,
          addressLine2: existingSession.billingAddress.addressLine2 || "",
          city: existingSession.billingAddress.city,
          district: existingSession.billingAddress.district || "",
          postalCode: existingSession.billingAddress.postalCode || "",
          country: existingSession.billingAddress.country,
          instructions: existingSession.billingAddress.instructions || "",
          saveAddress: false,
        }
      : undefined,
    paymentMethod:
      existingSession?.paymentMethod === "bank_transfer" ||
      existingSession?.paymentMethod === "cash_on_delivery"
        ? existingSession.paymentMethod
        : "card",
    notes: existingSession?.notes ?? "",
    ...input,
  }

  const validatedInput = checkoutSessionDraftSchema.parse(nextInput)
  const pricing = pricingOverride
    ? pricingOverride
    : calculateCheckoutPricing(
        cartValidation.cart.subtotal,
        ((validatedInput.shippingMethod as
          | CheckoutShippingMethod
          | undefined) ?? "standard") as CheckoutShippingMethod,
        ((validatedInput.paymentMethod as CheckoutPaymentMethod | undefined) ??
          "card") as CheckoutPaymentMethod,
        resolveCheckoutPricingConfig(settings),
      )

  const contactValue = normalizeDraftContact(validatedInput.contact)
  const shippingAddressValue = normalizeDraftAddress(
    validatedInput.shippingAddress,
  )
  const billingAddressValue =
    validatedInput.billingSameAsShipping || !validatedInput.billingAddress
      ? null
      : normalizeDraftAddress(validatedInput.billingAddress)

  const sessionValues = {
    contact: contactValue,
    accountIntent:
      validatedInput.accountIntent === "signin" ||
      validatedInput.accountIntent === "create_account"
        ? validatedInput.accountIntent
        : actor.userId
          ? "signin"
          : "guest",
    shippingAddress: shippingAddressValue,
    billingSameAsShipping: validatedInput.billingSameAsShipping ?? true,
    billingAddress: billingAddressValue,
    shippingMethod:
      (validatedInput.shippingMethod as CheckoutShippingMethod | undefined) ??
      "standard",
    paymentMethod:
      (validatedInput.paymentMethod as CheckoutPaymentMethod | undefined) ??
      "card",
    notes: validatedInput.notes ?? null,
    pricingSnapshot: {
      currency: "LKR" as const,
      subtotal: toMoneyString(pricing.subtotal),
      shippingCost: toMoneyString(pricing.shippingCost),
      taxAmount: toMoneyString(pricing.taxAmount),
      discountAmount: toMoneyString(pricing.discountAmount),
      codFee: toMoneyString(pricing.codFee),
      total: toMoneyString(pricing.total),
      freeShippingApplied: pricing.freeShippingApplied,
    },
    expiresAt: new Date(Date.now() + CHECKOUT_SESSION_TTL_MS),
    updatedAt: new Date(),
  }

  const sessionRecord = existingSession
    ? (
        await db
          .update(checkoutSessions)
          .set(sessionValues)
          .where(eq(checkoutSessions.id, existingSession.id))
          .returning()
      )[0]
    : (
        await db
          .insert(checkoutSessions)
          .values({
            cartId: actor.cart.id,
            userId: actor.userId,
            cartSessionId: actor.cartSessionId,
            ...sessionValues,
          })
          .returning()
      )[0]

  return {
    actor,
    summary,
    cartValidation,
    pricing,
    settings,
    addresses,
    session: sessionRecord,
    defaultInput: nextInput,
  }
}

export async function getOrCreateCheckoutSession() {
  const data = await upsertCheckoutSession()

  return {
    id: data.session.id,
    pricing: data.pricing,
    input: data.defaultInput,
  }
}

export async function updateCheckoutSession(input: CheckoutSessionInput) {
  const validatedInput = checkoutSessionInputSchema.parse(input)
  const data = await upsertCheckoutSession(validatedInput)

  return {
    success: true as const,
    sessionId: data.session.id,
    pricing: data.pricing,
  }
}

export async function getCheckoutPricing(sessionId: string) {
  const actor = await getCheckoutCart()
  const session = await db.query.checkoutSessions.findFirst({
    where: eq(checkoutSessions.id, sessionId),
  })

  if (!session || !actor.cart || session.cartId !== actor.cart.id) {
    throw new Error("Checkout session not found")
  }

  const data = await upsertCheckoutSession({
    shippingMethod:
      (session.shippingMethod as CheckoutShippingMethod | null) ?? "standard",
    paymentMethod:
      (session.paymentMethod as CheckoutPaymentMethod | null) ?? "card",
  })

  return data.pricing
}

export async function getCheckoutPageData(): Promise<CheckoutPageData | null> {
  try {
    const data = await upsertCheckoutSession()

    return {
      sessionId: data.session.id,
      isLoggedIn: Boolean(data.actor.userId),
      userEmail: data.actor.session?.user?.email ?? "",
      addresses: data.addresses,
      summary: data.summary,
      pricing: data.pricing,
      defaultInput: data.defaultInput,
    }
  } catch (error) {
    console.error("Failed to prebuild checkout session, using fallback:", error)

    const [summary, cart, addresses, session, settings] = await Promise.all([
      getCheckoutSummary(),
      getCart(),
      getUserAddresses(),
      getServerSession(),
      getSettingsMap(),
    ])

    if (!summary || cart.items.length === 0) {
      return null
    }

    const pricing = calculateCheckoutPricing(
      cart.subtotal,
      "standard",
      "card",
      resolveCheckoutPricingConfig(settings),
    )

    const defaultAddress =
      addresses.find((address) => address.isDefault) ?? addresses[0]

    return {
      sessionId: "",
      isLoggedIn: Boolean(session?.user?.id),
      userEmail: session?.user?.email ?? "",
      addresses,
      summary,
      pricing,
      defaultInput: {
        accountIntent: session?.user?.id ? "signin" : "guest",
        contact: {
          email: session?.user?.email ?? "",
          phone: defaultAddress?.phone ?? "",
        },
        shippingAddress: defaultAddress
          ? {
              addressId: defaultAddress.id,
              recipientName: defaultAddress.recipientName,
              phone: defaultAddress.phone,
              addressLine1: defaultAddress.addressLine1,
              addressLine2: defaultAddress.addressLine2 ?? "",
              city: defaultAddress.city,
              district: defaultAddress.district ?? "",
              postalCode: defaultAddress.postalCode ?? "",
              country: defaultAddress.country,
              instructions: "",
              saveAddress: false,
            }
          : {
              recipientName: "",
              phone: "",
              addressLine1: "",
              addressLine2: "",
              city: "",
              district: "",
              postalCode: "",
              country: "Sri Lanka",
              instructions: "",
              saveAddress: false,
            },
        billingSameAsShipping: true,
        shippingMethod: "standard",
        paymentMethod: "card",
        notes: "",
      },
    }
  }
}

async function clearCartItems(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId))
}

async function createOrderAccessTokenTx(
  tx: DbTransaction,
  orderId: string,
  email: string,
  kind: "confirmation" | "access" = "confirmation",
) {
  const token = nanoid(48)

  await tx.insert(guestOrderAccessTokens).values({
    orderId,
    email,
    kind,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ORDER_ACCESS_TOKEN_TTL_MS),
  })

  return token
}

async function saveCheckoutAddressIfNeeded(
  tx: DbTransaction,
  userId: string | null,
  input: CheckoutSessionInput,
) {
  if (
    !userId ||
    !input.shippingAddress.saveAddress ||
    input.shippingAddress.addressId
  ) {
    return
  }

  let profile = await tx.query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, userId),
  })

  if (!profile) {
    ;[profile] = await tx
      .insert(customerProfiles)
      .values({
        userId,
        phone: input.shippingAddress.phone,
      })
      .returning()
  }

  await tx.insert(customerAddresses).values({
    customerId: profile.id,
    type: "shipping",
    recipientName: input.shippingAddress.recipientName,
    phone: input.shippingAddress.phone,
    addressLine1: input.shippingAddress.addressLine1,
    addressLine2: input.shippingAddress.addressLine2 || null,
    city: input.shippingAddress.city,
    state: input.shippingAddress.district || null,
    postalCode: input.shippingAddress.postalCode || "",
    country: input.shippingAddress.country,
    instructions: input.shippingAddress.instructions || null,
    isDefault: false,
  })
}

async function createOrderFromCheckoutSession(
  tx: DbTransaction,
  input: CheckoutSessionInput,
  sessionId: string,
  actor: Awaited<ReturnType<typeof getCheckoutActor>>,
  cartValidation: NonNullable<CartValidationResult["cart"]>,
  pricing: CheckoutPricing,
  settings: Record<string, string>,
) {
  const orderPrefix = settings.order_prefix || "IUS"
  const orderNumber = `${orderPrefix}-${Date.now().toString(36).toUpperCase()}-${nanoid(5).toUpperCase()}`
  const billingAddress = input.billingSameAsShipping
    ? {
        recipientName: input.shippingAddress.recipientName,
        phone: input.shippingAddress.phone,
        addressLine1: input.shippingAddress.addressLine1,
        addressLine2: input.shippingAddress.addressLine2,
        city: input.shippingAddress.city,
        state: input.shippingAddress.district,
        postalCode: input.shippingAddress.postalCode || "",
        country: input.shippingAddress.country,
      }
    : {
        recipientName: input.billingAddress?.recipientName || "",
        phone: input.billingAddress?.phone || "",
        addressLine1: input.billingAddress?.addressLine1 || "",
        addressLine2: input.billingAddress?.addressLine2,
        city: input.billingAddress?.city || "",
        state: input.billingAddress?.district,
        postalCode: input.billingAddress?.postalCode || "",
        country: input.billingAddress?.country || "Sri Lanka",
      }

  const legacyStatus =
    input.paymentMethod === "cash_on_delivery"
      ? "processing"
      : "pending_payment"
  const paymentStatus =
    input.paymentMethod === "bank_transfer"
      ? "pending_verification"
      : input.paymentMethod === "cash_on_delivery"
        ? "unpaid"
        : "unpaid"

  const [order] = await tx
    .insert(orders)
    .values({
      orderNumber,
      userId: actor.userId,
      checkoutSessionId: sessionId,
      status: legacyStatus,
      paymentMethod: input.paymentMethod as
        | "card"
        | "bank_transfer"
        | "cash_on_delivery",
      paymentStatus: paymentStatus as
        | "unpaid"
        | "pending_verification"
        | "authorized"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled",
      fulfillmentStatus: "confirmed",
      currencyCode: "LKR",
      shippingMethod: input.shippingMethod,
      subtotal: toMoneyString(pricing.subtotal),
      shippingCost: toMoneyString(pricing.shippingCost),
      taxAmount: toMoneyString(pricing.taxAmount),
      discountAmount: toMoneyString(pricing.discountAmount),
      total: toMoneyString(pricing.total),
      customerEmail: input.contact.email,
      customerPhone: input.contact.phone,
      customerName: input.shippingAddress.recipientName,
      shippingAddress: {
        recipientName: input.shippingAddress.recipientName,
        phone: input.shippingAddress.phone,
        addressLine1: input.shippingAddress.addressLine1,
        addressLine2: input.shippingAddress.addressLine2,
        city: input.shippingAddress.city,
        state: input.shippingAddress.district,
        postalCode: input.shippingAddress.postalCode || "",
        country: input.shippingAddress.country,
        instructions: input.shippingAddress.instructions,
      },
      billingAddress,
      notes: input.notes || null,
    })
    .returning()

  for (const item of cartValidation.items) {
    await tx.insert(orderItems).values({
      orderId: order.id,
      variantId: item.variantId,
      productName: item.productName,
      productSlug: item.productSlug,
      variantName: item.variantName,
      sku: item.variantSku,
      snapshot: {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSlug: item.productSlug,
        variantName: item.variantName,
        sku: item.variantSku,
        manageInventory: item.manageInventory,
        trackingMode: item.trackingMode,
        receiptIdentifierTypes: item.receiptIdentifierTypes,
        unitPrice: item.variantPrice,
        currency: "LKR",
      },
      quantity: item.quantity,
      unitPrice: item.variantPrice,
      subtotal: toMoneyString(
        Number.parseFloat(item.variantPrice) * item.quantity,
      ),
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

  await tx.insert(orderStatusHistory).values({
    orderId: order.id,
    fromStatus: null,
    toStatus: legacyStatus,
    notes: "Order created from checkout",
    changedBy: actor.userId,
  })

  await tx
    .update(checkoutSessions)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(checkoutSessions.id, sessionId))

  await saveCheckoutAddressIfNeeded(tx, actor.userId, input)

  const confirmationToken = await createOrderAccessTokenTx(
    tx,
    order.id,
    input.contact.email,
    "confirmation",
  )
  await createOrderAccessTokenTx(tx, order.id, input.contact.email, "access")

  return { order, confirmationToken }
}

async function cancelSubmittedOrder(orderId: string, reason: string) {
  await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order) {
      return
    }

    await tx
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
        fulfillmentStatus: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: "cancelled",
      notes: reason,
      changedBy: order.userId,
    })
  })
}

export async function submitCheckoutSession(
  sessionId: string,
): Promise<SubmitCheckoutResult> {
  try {
    const actor = await getCheckoutActor()
    const session = await db.query.checkoutSessions.findFirst({
      where: eq(checkoutSessions.id, sessionId),
    })

    if (!session) {
      return { success: false, error: "Checkout session not found" }
    }

    const cartValidation = await validateCartForCheckout()
    if (!cartValidation.success || !cartValidation.cart) {
      return {
        success: false,
        error: cartValidation.errors?.[0] || "Cart is empty",
      }
    }

    const validatedInput = checkoutSessionInputSchema.safeParse({
      contact: session.contact,
      shippingAddress: session.shippingAddress,
      shippingMethod: session.shippingMethod,
      paymentMethod: session.paymentMethod,
      notes: session.notes,
    })

    if (!validatedInput.success) {
      return {
        success: false,
        error:
          validatedInput.error.errors[0]?.message ||
          "Checkout details are incomplete",
      }
    }

    const settings = await getSettingsMap()
    const pricing = calculateCheckoutPricing(
      cartValidation.cart.subtotal,
      validatedInput.data.shippingMethod as CheckoutShippingMethod,
      validatedInput.data.paymentMethod as CheckoutPaymentMethod,
      resolveCheckoutPricingConfig(settings),
    )

    const created = await db.transaction((tx) =>
      createOrderFromCheckoutSession(
        tx,
        validatedInput.data,
        session.id,
        actor,
        cartValidation.cart!,
        pricing,
        settings,
      ),
    )

    if (validatedInput.data.paymentMethod === "card") {
      const paymentResult = await initiateCardPayment({
        orderId: created.order.id,
        accessToken: created.confirmationToken,
      })

      if (!paymentResult.success || !paymentResult.paymentUrl) {
        await cancelSubmittedOrder(
          created.order.id,
          paymentResult.error || "Card payment initiation failed",
        )

        return {
          success: false,
          error: paymentResult.error || "Unable to start card payment",
        }
      }

      revalidatePath("/cart")
      revalidatePath("/checkout")
      void sendPlacedOrderEmails(created.order.id)

      return {
        success: true,
        redirectUrl: paymentResult.paymentUrl,
        paymentUrl: paymentResult.paymentUrl,
        orderId: created.order.id,
        orderNumber: created.order.orderNumber,
      }
    }

    const methodResult =
      validatedInput.data.paymentMethod === "bank_transfer"
        ? await recordBankTransferPayment(created.order.id)
        : await recordCODPayment(created.order.id)

    if (!methodResult.success) {
      await cancelSubmittedOrder(
        created.order.id,
        methodResult.error || "Checkout payment setup failed",
      )

      return {
        success: false,
        error: methodResult.error || "Unable to complete checkout",
      }
    }

    if (session.cartId) {
      await clearCartItems(session.cartId)
    }

    revalidatePath("/cart")
    revalidatePath("/checkout")
    revalidatePath("/orders")
    revalidatePath("/ops/orders")
    void sendPlacedOrderEmails(created.order.id)

    const postSubmitRedirect =
      validatedInput.data.paymentMethod === "bank_transfer"
        ? actor.userId
          ? `/orders/${created.order.id}/bank-transfer`
          : `/guest/orders/${created.confirmationToken}/bank-transfer`
        : `/checkout/success?token=${created.confirmationToken}`

    return {
      success: true,
      redirectUrl: postSubmitRedirect,
      confirmationToken: created.confirmationToken,
      orderId: created.order.id,
      orderNumber: created.order.orderNumber,
    }
  } catch (error) {
    console.error("Failed to submit checkout session:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit checkout",
    }
  }
}
