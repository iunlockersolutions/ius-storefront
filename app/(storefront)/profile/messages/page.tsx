import Link from "next/link"
import { redirect } from "next/navigation"

import { ArrowLeft, Mail } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOwnContactMessages } from "@/lib/actions/contact-message"
import { getServerSession } from "@/lib/auth/rbac"

export const metadata = {
  title: "My Messages",
  description: "Replies to your contact submissions",
}

const statusColors: Record<string, string> = {
  unread: "bg-blue-100 text-blue-800",
  open: "bg-purple-100 text-purple-800",
  replied: "bg-green-100 text-green-800",
  closed: "bg-neutral-100 text-neutral-700",
  spam: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  unread: "Awaiting reply",
  open: "Being reviewed",
  replied: "Replied",
  closed: "Closed",
  spam: "Closed",
}

function formatDateLong(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default async function ProfileMessagesPage() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/profile/messages")
  }

  const result = await getOwnContactMessages()
  const messages = result.success && result.data ? result.data.messages : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-1">Back to profile</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">My Messages</h1>
          <p className="text-muted-foreground text-sm">
            Replies to your contact submissions
          </p>
        </div>
      </div>

      {!result.success ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-red-600">
            {result.error || "Failed to load messages."}
          </CardContent>
        </Card>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Mail className="h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium">No messages yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once you submit a message via the contact form, it will appear
              here with any replies from our team.
            </p>
            <Button asChild>
              <Link href="/#contact">Send a message</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => {
            const replies = message.replies
            return (
              <Card key={message.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      Message sent {formatDateLong(message.createdAt)}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {replies.length === 0
                        ? "No reply yet"
                        : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                    </p>
                  </div>
                  <Badge className={statusColors[message.status]}>
                    {statusLabels[message.status]}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border bg-neutral-50 px-4 py-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Your message
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-neutral-800">
                      {message.message}
                    </p>
                  </div>

                  {replies.length > 0 ? (
                    <div className="space-y-2">
                      {replies.map((reply) => {
                        const body =
                          typeof reply.payload.body === "string"
                            ? reply.payload.body
                            : ""
                        const actorName =
                          reply.actor?.name || reply.actor?.email || "Our team"
                        return (
                          <div
                            key={reply.id}
                            className="rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3"
                          >
                            <div className="mb-1 flex items-center justify-between text-xs text-emerald-800">
                              <span className="font-medium">
                                {actorName} replied
                              </span>
                              <span>{formatDateLong(reply.createdAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-neutral-800">
                              {body}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="rounded-md bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                      Our team will reply soon.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
