"use client"

import Image from "next/image"

import { Lock, Package, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CheckoutSummary as CheckoutSummaryType } from "@/lib/schemas/checkout"

interface CheckoutSummaryProps {
  summary: CheckoutSummaryType
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function CheckoutSummary({ summary }: CheckoutSummaryProps) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Summary
            <Badge variant="secondary" className="ml-auto">
              {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {summary.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.variant}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals - Will be updated based on selections */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">
                Calculated at next step
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-muted-foreground">
                Calculated at next step
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>{formatCurrency(summary.subtotal)}</span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Final total will be shown before placing order
          </p>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-green-600" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Buyer Protection</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
