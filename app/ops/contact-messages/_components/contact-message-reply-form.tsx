"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useReplyContactMessageMutation } from "@/services/mutations/use-contact-message-mutations"

interface ContactMessageReplyFormProps {
  id: string
  recipientEmail: string
}

export function ContactMessageReplyForm({
  id,
  recipientEmail,
}: ContactMessageReplyFormProps) {
  const reply = useReplyContactMessageMutation(id)
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const trimmed = body.trim()
    if (trimmed.length < 1) {
      setError("Reply cannot be empty")
      return
    }
    reply.mutate(trimmed, {
      onSuccess: () => {
        setBody("")
        setSuccess(`Reply sent to ${recipientEmail}.`)
      },
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Failed to send reply"),
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="contact-reply-body"
          className="text-sm font-medium text-foreground"
        >
          Send a reply to {recipientEmail}
        </label>
        <Textarea
          id="contact-reply-body"
          name="body"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your reply..."
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {success}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={reply.isPending}>
          {reply.isPending ? "Sending..." : "Send reply"}
        </Button>
      </div>
    </form>
  )
}
