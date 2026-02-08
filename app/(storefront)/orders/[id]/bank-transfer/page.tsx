import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getCustomerOrder } from "@/lib/actions/customer-orders"
import { getServerSession } from "@/lib/auth/rbac"

import { BankTransferUploadForm } from "./upload-form"

interface BankTransferPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Bank Transfer Payment | IUS Shop",
  description: "Complete your bank transfer payment",
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

// Bank details - these would typically come from settings
const bankDetails = {
  bankName: "Commercial Bank of Ceylon",
  accountName: "IUS Shop Pvt Ltd",
  accountNumber: "1234567890",
  branchCode: "001",
  branchName: "Colombo Main",
  swiftCode: "CCEYLKLX",
}

export default async function BankTransferPage({
  params,
}: BankTransferPageProps) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/orders")
  }

  const { id } = await params
  const order = await getCustomerOrder(id)

  if (!order) {
    notFound()
  }

  // Check if order is awaiting bank transfer payment
  if (
    order.status !== "pending_payment" ||
    order.payment?.method !== "bank_transfer"
  ) {
    redirect(`/orders/${id}`)
  }

  const paymentCompleted = order.payment?.status === "completed"
  const paymentPending = order.payment?.status === "pending"

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Link */}
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href={`/orders/${id}`}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Order
        </Link>
      </Button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Bank Transfer Payment</h1>
        <p className="text-muted-foreground">
          Order #{order.orderNumber} · {formatCurrency(order.total)}
        </p>
      </div>

      {/* Status */}
      {paymentPending && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">
                Awaiting Payment Verification
              </p>
              <p className="text-sm text-yellow-700">
                Please transfer the amount and upload proof of payment below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentCompleted && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Payment Verified</p>
              <p className="text-sm text-green-700">
                Your payment has been confirmed. Your order is being processed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bank Account Details</CardTitle>
          <CardDescription>
            Please transfer exactly {formatCurrency(order.total)} to the
            following account
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
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium">
                  {bankDetails.accountNumber}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    navigator.clipboard.writeText(bankDetails.accountNumber)
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Branch Code</p>
              <p className="font-medium">{bankDetails.branchCode}</p>
            </div>
            <div>
              <p className="text-muted-foreground">SWIFT Code</p>
              <p className="font-mono font-medium">{bankDetails.swiftCode}</p>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-1">Payment Reference</p>
            <p className="font-mono text-lg">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please include this reference in your transfer description
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Transfer the exact amount: {formatCurrency(order.total)}</li>
              <li>Include order number as payment reference</li>
              <li>Upload proof of payment after transfer</li>
              <li>Verification typically takes 1-2 business days</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      {!paymentCompleted && order.payment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Proof of Payment
            </CardTitle>
            <CardDescription>
              Upload a screenshot or photo of your bank transfer receipt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BankTransferUploadForm
              paymentId={order.payment.id}
              orderId={order.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
