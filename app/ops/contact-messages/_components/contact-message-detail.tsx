"use client"

import Link from "next/link"

import { ExternalLink, Mail, Phone, User as UserIcon } from "lucide-react"

import { WhatsApp } from "@/components/icons/svg/whatsapp"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BUSINESS_NUMBER } from "@/configs/config"
import type {
  AdminContactMessageDetail as ContactMessageDetailModel,
  AdminContactMessageEvent,
} from "@/lib/types/admin-contact-message"
import { formatDate } from "@/lib/utils"

import { ContactMessageReplyForm } from "./contact-message-reply-form"
import { ContactMessageStatusControls } from "./contact-message-status-controls"

const statusColors: Record<string, string> = {
  unread: "bg-blue-100 text-blue-800",
  open: "bg-purple-100 text-purple-800",
  replied: "bg-green-100 text-green-800",
  closed: "bg-neutral-100 text-neutral-700",
  spam: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  unread: "Unread",
  open: "Open",
  replied: "Replied",
  closed: "Closed",
  spam: "Spam",
}

function initialsOf(name: string | null, email: string) {
  const source = name?.trim() || email
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function buildWhatsAppLink(phone: string, senderName: string) {
  const digits = phone.replace(/[^\d]/g, "")
  const target = digits.length > 0 ? digits : BUSINESS_NUMBER
  const text = encodeURIComponent(
    `Hello ${senderName}, this is regarding your message to our store.`,
  )
  return `https://wa.me/${target}?text=${text}`
}

function ReplyEvent({ event }: { event: AdminContactMessageEvent }) {
  if (event.type !== "reply_sent") return null
  const body = typeof event.payload.body === "string" ? event.payload.body : ""
  const actorName = event.actor?.name || event.actor?.email || "Staff"

  return (
    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
        <span className="font-medium">{actorName} replied</span>
        <span>{formatDate(event.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{body}</p>
    </div>
  )
}

export function ContactMessageDetail({
  message,
}: {
  message: ContactMessageDetailModel
}) {
  const replies = message.events.filter((event) => event.type === "reply_sent")

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main thread column */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {initialsOf(message.senderName, message.senderEmail)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {message.senderName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {message.senderEmail}
                  {message.senderPhone ? ` · ${message.senderPhone}` : ""}
                </p>
              </div>
            </div>
            <Badge className={statusColors[message.status]}>
              {statusLabels[message.status]}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Received {formatDate(message.createdAt)}
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {message.message}
            </p>
          </CardContent>
        </Card>

        {replies.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Replies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {replies.map((event) => (
                <ReplyEvent key={event.id} event={event} />
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactMessageReplyForm
              id={message.id}
              recipientEmail={message.senderEmail}
            />
          </CardContent>
        </Card>
      </div>

      {/* Side panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triage</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactMessageStatusControls
              id={message.id}
              status={message.status}
              assigneeId={message.assignee?.id ?? null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sender</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{message.senderName}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                className="hover:underline"
                href={`mailto:${message.senderEmail}`}
              >
                {message.senderEmail}
              </a>
            </div>
            {message.senderPhone ? (
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  className="hover:underline"
                  href={`tel:${message.senderPhone}`}
                >
                  {message.senderPhone}
                </a>
              </div>
            ) : null}

            {message.senderPhone ? (
              <Button
                asChild
                className="w-full bg-green-500 text-white hover:bg-green-600"
              >
                <a
                  href={buildWhatsAppLink(
                    message.senderPhone,
                    message.senderName,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsApp className="mr-2 h-4 w-4" />
                  Reply via WhatsApp
                </a>
              </Button>
            ) : null}

            {message.user ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/ops/customers/${message.user.id}`}>
                  Open customer profile
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Submitted as guest (no account linked).
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
