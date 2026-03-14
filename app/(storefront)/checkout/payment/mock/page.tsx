import { notFound } from "next/navigation"

import { MockCardPaymentForm } from "@/components/storefront/checkout/mock-card-payment-form"
import { getMockCardPaymentContext } from "@/lib/actions/payment"

interface MockCardPaymentPageProps {
  searchParams: Promise<{
    paymentId?: string
    token?: string
  }>
}

export const metadata = {
  title: "Mock Card Payment | IUS Shop",
  description: "Complete your mock card payment",
}

export default async function MockCardPaymentPage({
  searchParams,
}: MockCardPaymentPageProps) {
  const params = await searchParams

  if (!params.paymentId || !params.token) {
    notFound()
  }

  const context = await getMockCardPaymentContext(
    params.paymentId,
    params.token,
  )

  if (!context) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Mock Hosted Payment
        </p>
        <h1 className="mt-2 text-3xl font-bold">Complete your card payment</h1>
        <p className="mt-2 text-muted-foreground">
          Finish this mock card payment to place your order and receive the paid
          invoice email.
        </p>
      </div>

      <MockCardPaymentForm
        paymentId={context.paymentId}
        accessToken={context.token}
        orderNumber={context.orderNumber}
        customerEmail={context.customerEmail}
        total={context.total}
        items={context.items}
      />
    </div>
  )
}
