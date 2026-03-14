"use client"

import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CheckoutPricing } from "@/lib/checkout/pricing"
import type { CheckoutSummary as CheckoutSummaryType } from "@/lib/schemas/checkout"
import { formatCurrency } from "@/lib/utils"

interface CheckoutSummaryProps {
  summary: CheckoutSummaryType
  pricing: CheckoutPricing
  shippingMethod: "standard" | "express"
  paymentMethod: "card" | "bank_transfer" | "cash_on_delivery"
}

export function CheckoutSummary({
  summary,
  pricing,
  shippingMethod,
  paymentMethod,
}: CheckoutSummaryProps) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>Order summary</span>
            <Badge variant="secondary">
              {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {summary.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.variant} · {item.sku}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Qty {item.quantity}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Shipping (
                {shippingMethod === "express" ? "Express" : "Standard"})
              </span>
              <span>
                {pricing.shippingCost === 0
                  ? "Free"
                  : formatCurrency(pricing.shippingCost)}
              </span>
            </div>
            {pricing.codFee > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Cash on delivery fee
                </span>
                <span>{formatCurrency(pricing.codFee)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(pricing.taxAmount)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(pricing.total)}</span>
          </div>

          <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <p>
              Payment method:{" "}
              {paymentMethod === "card"
                ? "Card"
                : paymentMethod === "bank_transfer"
                  ? "Bank transfer"
                  : "Cash on delivery"}
            </p>
            <p className="mt-1">All prices are charged in Sri Lankan Rupees.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
