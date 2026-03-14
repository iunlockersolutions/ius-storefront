"use client"

import Link from "next/link"

import {
  AlertTriangle,
  CreditCard,
  LogIn,
  ShieldCheck,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CheckoutPricing } from "@/lib/checkout/pricing"
import { formatCurrency } from "@/lib/utils"

const EMPTY_ERRORS: string[] = []

interface CartSummaryProps {
  pricing: CheckoutPricing
  itemCount: number
  errors?: string[]
}

export function CartSummary({
  pricing,
  itemCount,
  errors = EMPTY_ERRORS,
}: CartSummaryProps) {
  const canCheckout = errors.length === 0

  return (
    <div className="sticky top-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canCheckout ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-destructive">
                    Review your cart before checkout
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Standard shipping</span>
              <span>
                {pricing.shippingCost === 0
                  ? "Free"
                  : formatCurrency(pricing.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(pricing.taxAmount)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(pricing.total)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {canCheckout ? (
            <Button asChild className="w-full" size="lg">
              <Link href="/checkout">
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Checkout
              </Link>
            </Button>
          ) : (
            <Button className="w-full" size="lg" disabled>
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Checkout options</p>
            <Badge variant="secondary">Guest friendly</Badge>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium">Secure checkout</p>
                <p className="text-xs text-muted-foreground">
                  Card, bank transfer, and cash on delivery in LKR.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-sky-600" />
              <div>
                <p className="font-medium">Delivery options</p>
                <p className="text-xs text-muted-foreground">
                  Standard and express delivery with live pricing.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-violet-600" />
              <div>
                <p className="font-medium">Guest or signed in</p>
                <p className="text-xs text-muted-foreground">
                  Sign in for saved addresses and order history, or check out as
                  a guest.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
