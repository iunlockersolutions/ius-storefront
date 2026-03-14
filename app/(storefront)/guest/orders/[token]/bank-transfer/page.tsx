import Link from "next/link"
import { notFound } from "next/navigation"

import { Building2, CheckCircle2, Clock, Home, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getGuestOrderByAccessToken } from "@/lib/actions/customer-orders"
import { getBankTransferDetails } from "@/lib/payments/bank-transfer-details"
import { formatCurrency } from "@/lib/utils"

import { BankTransferUploadForm } from "../../../../orders/[id]/bank-transfer/upload-form"

interface GuestBankTransferPageProps {
  params: Promise<{ token: string }>
}

export const metadata = {
  title: "Guest Bank Transfer | IUS Shop",
  description: "Complete your bank transfer securely for a guest order.",
}

export default async function GuestBankTransferPage({
  params,
}: GuestBankTransferPageProps) {
  const { token } = await params
  const [order, bankDetails] = await Promise.all([
    getGuestOrderByAccessToken(token),
    getBankTransferDetails(),
  ])

  if (!order) {
    notFound()
  }

  if (
    order.payment?.method !== "bank_transfer" ||
    order.status !== "pending_payment"
  ) {
    notFound()
  }

  const paymentCompleted = order.payment.status === "completed"
  const paymentPending = order.payment.status === "pending"

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        Secure guest payment access for order {order.orderNumber}
      </div>

      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Complete Your Bank Transfer</h1>
        <p className="text-muted-foreground">
          Order #{order.orderNumber} · {formatCurrency(order.total)}
        </p>
      </div>

      {paymentPending ? (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="flex gap-3 py-4">
            <Clock className="mt-0.5 h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">
                Awaiting Payment Verification
              </p>
              <p className="text-sm text-yellow-700">
                Transfer the exact amount below and upload your proof of
                payment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {paymentCompleted ? (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex gap-3 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Payment Verified</p>
              <p className="text-sm text-green-700">
                Your transfer has been confirmed and your order is moving
                forward.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bank Account Details</CardTitle>
          <CardDescription>
            Transfer exactly {formatCurrency(order.total)} to this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Bank Name</p>
              <p className="font-medium">{bankDetails.bankName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Branch</p>
              <p className="font-medium">{bankDetails.branchName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Account Name</p>
              <p className="font-medium">{bankDetails.accountName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Account Number</p>
              <p className="font-mono font-medium">
                {bankDetails.accountNumber}
              </p>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-1 text-sm font-medium">Payment Reference</p>
            <p className="font-mono text-lg">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Include this order number in the transfer reference.
            </p>
          </div>
        </CardContent>
      </Card>

      {!paymentCompleted && order.payment ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Proof of Payment</CardTitle>
            <CardDescription>
              Upload a screenshot or PDF of your transfer receipt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BankTransferUploadForm
              paymentId={order.payment.id}
              orderId={order.id}
              accessToken={token}
              returnHref={`/guest/orders/${token}`}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href={`/guest/orders/${token}`}>View Order</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
