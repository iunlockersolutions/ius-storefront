import { getOrderConfirmationById } from "@/lib/actions/customer-orders"

export async function getCheckoutSuccessOrder(orderId: string) {
  return getOrderConfirmationById(orderId)
}
