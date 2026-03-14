"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { CreditCard, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  cancelMockCardPayment,
  submitMockCardPayment,
} from "@/lib/actions/payment"
import { formatCurrency } from "@/lib/utils"

interface MockCardPaymentFormProps {
  paymentId: string
  accessToken: string
  orderNumber: string
  customerEmail: string
  total: string
  items: Array<{
    id: string
    productName: string
    variantName: string
    quantity: number
    subtotal: string
  }>
}

export function MockCardPaymentForm({
  paymentId,
  accessToken,
  orderNumber,
  customerEmail,
  total,
  items,
}: MockCardPaymentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cardholderName, setCardholderName] = useState("")
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242")
  const [expiry, setExpiry] = useState("12/30")
  const [cvc, setCvc] = useState("123")

  function handleOutcome(outcome: "success" | "failed") {
    startTransition(async () => {
      const result = await submitMockCardPayment({
        paymentId,
        accessToken,
        cardholderName,
        cardNumber,
        expiry,
        cvc,
        outcome,
      })

      if (!result.success || !result.redirectUrl) {
        toast.error(result.error || "Unable to process mock payment")
        return
      }

      router.push(result.redirectUrl)
      router.refresh()
    })
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelMockCardPayment(paymentId, accessToken)

      if (!result.success || !result.redirectUrl) {
        toast.error(result.error || "Unable to cancel payment")
        return
      }

      router.push(result.redirectUrl)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mock card payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            This is a mock payment page for development. Use the form for a
            realistic flow, then choose whether to complete or fail the payment.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mock-cardholder-name">Cardholder name</Label>
              <Input
                id="mock-cardholder-name"
                value={cardholderName}
                onChange={(event) => setCardholderName(event.target.value)}
                placeholder="Janith Perera"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mock-card-number">Card number</Label>
              <Input
                id="mock-card-number"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mock-expiry">Expiry</Label>
              <Input
                id="mock-expiry"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                placeholder="MM/YY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mock-cvc">CVC</Label>
              <Input
                id="mock-cvc"
                value={cvc}
                onChange={(event) => setCvc(event.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Test payment behavior</p>
                <p className="text-emerald-900/80">
                  `Pay successfully` marks the order as paid and sends the
                  invoice email. `Fail payment` restores the cart and cancels
                  the order.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              disabled={isPending}
              onClick={() => handleOutcome("success")}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Pay successfully
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={isPending}
              onClick={() => handleOutcome("failed")}
            >
              Fail payment
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isPending}
              onClick={handleCancel}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Order number</p>
            <p className="font-mono font-medium">{orderNumber}</p>
            <p className="mt-1 text-muted-foreground">{customerEmail}</p>
          </div>
          <Separator />
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground">
                    {item.variantName} × {item.quantity}
                  </p>
                </div>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
