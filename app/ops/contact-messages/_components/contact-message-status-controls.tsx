"use client"

import { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminContactMessageStatus } from "@/lib/types/admin-contact-message"
import {
  useAssignContactMessageMutation,
  useUpdateContactMessageStatusMutation,
} from "@/services/mutations/use-contact-message-mutations"
import { useStaffUsersQuery } from "@/services/queries/use-staff-users-query"

interface ContactMessageStatusControlsProps {
  id: string
  status: AdminContactMessageStatus
  assigneeId: string | null
}

const STATUS_OPTIONS: Array<{
  value: AdminContactMessageStatus
  label: string
}> = [
  { value: "unread", label: "Unread" },
  { value: "open", label: "Open" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
]

const UNASSIGNED = "__unassigned__"

export function ContactMessageStatusControls({
  id,
  status,
  assigneeId,
}: ContactMessageStatusControlsProps) {
  const updateStatus = useUpdateContactMessageStatusMutation(id)
  const assign = useAssignContactMessageMutation(id)
  const staff = useStaffUsersQuery({ limit: 100 })
  const [error, setError] = useState<string | null>(null)

  const onChangeStatus = (value: string) => {
    setError(null)
    updateStatus.mutate(value as AdminContactMessageStatus, {
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Update failed"),
    })
  }

  const onChangeAssignee = (value: string) => {
    setError(null)
    assign.mutate(value === UNASSIGNED ? null : value, {
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Assign failed"),
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          Status
        </span>
        <Select value={status} onValueChange={onChangeStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          Assignee
        </span>
        <Select
          value={assigneeId ?? UNASSIGNED}
          onValueChange={onChangeAssignee}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {(staff.data?.users ?? []).map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name || member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-xs text-destructive sm:ml-3">{error}</p>
      ) : null}
    </div>
  )
}
