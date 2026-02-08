"use client"

import Link from "next/link"

import { CreditCard, ShieldCheck, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface CartSummaryProps {
  subtotal: number
  itemCount: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  // These would typically come from settings or calculated based on location
  const shipping = subtotal >= 100 ? 0 : 9.99
  const tax = subtotal * 0.08 // 8% tax estimate
  const total = subtotal + shipping + tax

  return (
    <div className="sticky top-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              {shipping === 0 ? (
                <span className="text-green-600 font-medium">FREE</span>
              ) : (
                <span>{formatCurrency(shipping)}</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {shipping > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Add {formatCurrency(100 - subtotal)} more for free shipping!
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/checkout">
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Trust badges */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium">Secure Checkout</p>
              <p className="text-xs text-muted-foreground">
                Your data is protected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium">Free Shipping</p>
              <p className="text-xs text-muted-foreground">
                On orders over $100
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
