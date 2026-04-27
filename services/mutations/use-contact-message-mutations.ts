"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type ContactMessageStatus = "unread" | "open" | "replied" | "closed" | "spam"

async function parseJsonOrThrow(response: Response, fallback: string) {
  if (response.ok) {
    return response.json()
  }
  const errorBody = await response.json().catch(() => null)
  const message = errorBody?.error?.message || errorBody?.error || fallback
  throw new Error(message)
}

export function useUpdateContactMessageStatusMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (status: ContactMessageStatus) => {
      const response = await fetch(`/api/admin/contact-messages/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      return parseJsonOrThrow(response, "Failed to update status")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "contactMessage.updateStatus", {
        contactMessageId: id,
      })
    },
  })
}

export function useAssignContactMessageMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (assigneeId: string | null) => {
      const response = await fetch(
        `/api/admin/contact-messages/${id}/assignee`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeId }),
        },
      )
      return parseJsonOrThrow(response, "Failed to update assignee")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "contactMessage.assign", {
        contactMessageId: id,
      })
    },
  })
}

export function useReplyContactMessageMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const response = await fetch(`/api/admin/contact-messages/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      return parseJsonOrThrow(response, "Failed to send reply")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "contactMessage.reply", {
        contactMessageId: id,
      })
    },
  })
}

export function useDeleteContactMessageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "DELETE",
      })
      return parseJsonOrThrow(response, "Failed to delete message")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "contactMessage.delete", {})
    },
  })
}
