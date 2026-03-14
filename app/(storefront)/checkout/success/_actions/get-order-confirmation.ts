import { getOrderConfirmationByToken } from "@/lib/actions/customer-orders"

export async function getCheckoutSuccessOrder(token: string) {
  return getOrderConfirmationByToken(token)
}
