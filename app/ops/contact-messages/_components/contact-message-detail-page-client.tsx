"use client"

import Link from "next/link"

import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAdminContactMessageQuery } from "@/services/queries/use-admin-contact-message-query"

import { ContactMessageDetail } from "./contact-message-detail"

interface ContactMessageDetailPageClientProps {
  id: string
}

export function ContactMessageDetailPageClient({
  id,
}: ContactMessageDetailPageClientProps) {
  const messageQuery = useAdminContactMessageQuery(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ops/contact-messages">
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-1">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Contact Message</h1>
          <p className="text-muted-foreground">
            Conversation thread and triage
          </p>
        </div>
      </div>

      {messageQuery.isLoading ? (
        <div className="rounded-md border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          Loading message...
        </div>
      ) : messageQuery.error instanceof Error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {messageQuery.error.message}
        </div>
      ) : messageQuery.data ? (
        <ContactMessageDetail message={messageQuery.data} />
      ) : null}
    </div>
  )
}
