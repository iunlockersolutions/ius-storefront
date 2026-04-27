"use client"

import {
  type ContactMessageStatusFilter,
  useAdminContactMessagesQuery,
} from "@/services/queries/use-admin-contact-messages-query"

import { ContactMessagesTable } from "./contact-messages-table"

interface ContactMessagesPageClientProps {
  page: number
  search: string
  status: ContactMessageStatusFilter | ""
  assigneeId: string
}

export function ContactMessagesPageClient({
  page,
  search,
  status,
  assigneeId,
}: ContactMessagesPageClientProps) {
  const messagesQuery = useAdminContactMessagesQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    assigneeId: assigneeId || undefined,
  })

  return (
    <ContactMessagesTable
      messages={messagesQuery.data?.messages ?? []}
      total={messagesQuery.data?.pagination.total ?? 0}
      page={messagesQuery.data?.pagination.page ?? page}
      totalPages={messagesQuery.data?.pagination.totalPages ?? 0}
      search={search}
      status={status}
      isLoading={messagesQuery.isLoading || messagesQuery.isFetching}
      errorMessage={
        messagesQuery.error instanceof Error
          ? messagesQuery.error.message
          : null
      }
    />
  )
}
