import { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export type AdminMutationKey =
  | "category.create"
  | "category.update"
  | "category.delete"
  | "customerRole.assign"
  | "customerRole.remove"
  | "review.moderate"
  | "review.bulkModerate"
  | "review.delete"
  | "inventory.adjust"
  | "inventory.updateThreshold"
  | "order.updateStatus"
  | "order.updateNotes"
  | "payment.verifyBankTransfer"
  | "product.create"
  | "product.update"
  | "product.updateImages"
  | "product.delete"
  | "settings.updateSite"
  | "profile.update"
  | "profile.changePassword"
  | "profile.revokeSession"
  | "profile.revokeAllOtherSessions"
  | "staff.ban"
  | "staff.unban"
  | "staff.resetPassword"
  | "staff.delete"

export interface MutationInvalidationContext {
  categoryId?: string
  customerId?: string
  orderId?: string
}

function getInvalidationTargets(
  mutation: AdminMutationKey,
  context: MutationInvalidationContext,
) {
  switch (mutation) {
    case "category.create":
    case "category.delete":
      return [queryKeys.admin.categories()]

    case "category.update":
      return context.categoryId
        ? [
            queryKeys.admin.categories(),
            queryKeys.admin.category(context.categoryId),
          ]
        : [queryKeys.admin.categories()]

    case "customerRole.assign":
    case "customerRole.remove":
      return context.customerId
        ? [
            queryKeys.admin.customer(context.customerId),
            queryKeys.admin.customerOrders(context.customerId),
          ]
        : []

    case "review.moderate":
    case "review.bulkModerate":
    case "review.delete":
      return [
        queryKeys.admin.reviews(),
        queryKeys.admin.pendingReviews(),
        queryKeys.admin.reviewStats(),
      ]

    case "inventory.adjust":
    case "inventory.updateThreshold":
      return [queryKeys.admin.inventory()]

    case "order.updateStatus":
      return context.orderId
        ? [queryKeys.admin.orders(), queryKeys.admin.order(context.orderId)]
        : [queryKeys.admin.orders()]

    case "order.updateNotes":
      return context.orderId ? [queryKeys.admin.order(context.orderId)] : []

    case "payment.verifyBankTransfer":
      return context.orderId
        ? [
            queryKeys.admin.payments(),
            queryKeys.admin.paymentStats(),
            queryKeys.admin.pendingBankTransfers(),
            queryKeys.admin.orders(),
            queryKeys.admin.order(context.orderId),
          ]
        : [
            queryKeys.admin.payments(),
            queryKeys.admin.paymentStats(),
            queryKeys.admin.pendingBankTransfers(),
            queryKeys.admin.orders(),
          ]

    case "product.create":
    case "product.update":
    case "product.updateImages":
    case "product.delete":
      return [queryKeys.admin.products()]

    case "settings.updateSite":
      return [queryKeys.admin.settings()]

    case "profile.update":
    case "profile.changePassword":
      return [queryKeys.admin.profile()]

    case "profile.revokeSession":
    case "profile.revokeAllOtherSessions":
      return [queryKeys.admin.profileSessions()]

    case "staff.ban":
    case "staff.unban":
    case "staff.resetPassword":
    case "staff.delete":
      return [queryKeys.admin.staffUsers()]

    default:
      return []
  }
}

export async function invalidateMutationCaches(
  queryClient: QueryClient,
  mutation: AdminMutationKey,
  context: MutationInvalidationContext = {},
) {
  const targets = getInvalidationTargets(mutation, context)

  await Promise.all(
    targets.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
      }),
    ),
  )
}
