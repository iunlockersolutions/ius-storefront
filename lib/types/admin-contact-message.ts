export type AdminContactMessageStatus =
  | "unread"
  | "open"
  | "replied"
  | "closed"
  | "spam"

export type AdminContactMessageEventType =
  | "reply_sent"
  | "status_changed"
  | "assigned"

export interface AdminContactMessageActor {
  id: string
  name: string | null
  email: string
}

export interface AdminContactMessageEvent {
  id: string
  type: AdminContactMessageEventType
  payload: Record<string, unknown>
  createdAt: string
  actor: AdminContactMessageActor | null
}

export interface AdminContactMessage {
  id: string
  senderName: string
  senderEmail: string
  senderPhone: string | null
  message: string
  status: AdminContactMessageStatus
  userId: string | null
  user: {
    id: string
    name: string | null
    email: string
  } | null
  assignee: AdminContactMessageActor | null
  createdAt: string
  updatedAt: string
  repliedAt: string | null
}

export interface AdminContactMessageDetail extends AdminContactMessage {
  events: AdminContactMessageEvent[]
}

export interface AdminContactMessageListResult {
  messages: AdminContactMessage[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminNotification {
  id: string
  type: "contact_message_created"
  targetRef: string
  title: string
  preview: string
  readAt: string | null
  createdAt: string
}

export interface AdminNotificationFeed {
  items: AdminNotification[]
  unreadCount: number
}
