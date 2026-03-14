export type CheckoutShippingMethod = "standard" | "express"
export type CheckoutPaymentMethod =
  | "card"
  | "bank_transfer"
  | "cash_on_delivery"

export interface CheckoutPricingConfig {
  currency: "LKR"
  freeShippingThreshold: number
  standardShippingRate: number
  expressShippingRate: number
  codFee: number
  taxRate: number
}

export interface CheckoutPricing {
  currency: "LKR"
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  codFee: number
  total: number
  freeShippingApplied: boolean
}

export const DEFAULT_CHECKOUT_PRICING_CONFIG: CheckoutPricingConfig = {
  currency: "LKR",
  freeShippingThreshold: 5000,
  standardShippingRate: 350,
  expressShippingRate: 750,
  codFee: 100,
  taxRate: 0,
}

export function resolveCheckoutPricingConfig(
  settings?: Record<string, string>,
): CheckoutPricingConfig {
  const getNumber = (key: string, fallback: number) => {
    const rawValue = settings?.[key]
    if (!rawValue) {
      return fallback
    }

    const parsed = Number.parseFloat(rawValue)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return {
    currency: "LKR",
    freeShippingThreshold: getNumber(
      "free_shipping_threshold",
      DEFAULT_CHECKOUT_PRICING_CONFIG.freeShippingThreshold,
    ),
    standardShippingRate: getNumber(
      "standard_shipping_rate",
      DEFAULT_CHECKOUT_PRICING_CONFIG.standardShippingRate,
    ),
    expressShippingRate: getNumber(
      "express_shipping_rate",
      DEFAULT_CHECKOUT_PRICING_CONFIG.expressShippingRate,
    ),
    codFee: getNumber("cod_fee", DEFAULT_CHECKOUT_PRICING_CONFIG.codFee),
    taxRate: getNumber("tax_rate", DEFAULT_CHECKOUT_PRICING_CONFIG.taxRate),
  }
}

export function calculateCheckoutPricing(
  subtotal: number,
  shippingMethod: CheckoutShippingMethod,
  paymentMethod: CheckoutPaymentMethod,
  config: CheckoutPricingConfig = DEFAULT_CHECKOUT_PRICING_CONFIG,
): CheckoutPricing {
  const freeShippingApplied =
    shippingMethod === "standard" && subtotal >= config.freeShippingThreshold

  const shippingCost =
    shippingMethod === "express"
      ? config.expressShippingRate
      : freeShippingApplied
        ? 0
        : config.standardShippingRate

  const codFee =
    paymentMethod === "cash_on_delivery" ? Math.max(config.codFee, 0) : 0
  const taxAmount = Math.max(subtotal * config.taxRate, 0)
  const total = subtotal + shippingCost + taxAmount + codFee

  return {
    currency: config.currency,
    subtotal,
    shippingCost,
    taxAmount,
    discountAmount: 0,
    codFee,
    total,
    freeShippingApplied,
  }
}
