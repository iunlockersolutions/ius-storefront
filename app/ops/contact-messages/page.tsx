import { ContactMessagesPageClient } from "./_components/contact-messages-page-client"

export const metadata = {
  title: "Contact Messages | Operations",
  description: "Triage and reply to customer contact submissions",
}

interface ContactMessagesPageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
    assigneeId?: string
  }>
}

const VALID_STATUSES = ["unread", "open", "replied", "closed", "spam"] as const

type Status = (typeof VALID_STATUSES)[number]

function parseStatus(value: string | undefined): Status | "" {
  if (!value) return ""
  return (VALID_STATUSES as readonly string[]).includes(value)
    ? (value as Status)
    : ""
}

export default async function ContactMessagesPage({
  searchParams,
}: ContactMessagesPageProps) {
  const params = await searchParams
  const status = parseStatus(params.status)
  const search = params.search || ""
  const assigneeId = params.assigneeId || ""
  const page = Number.parseInt(params.page || "1", 10) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground">
          Triage submissions from the storefront contact form
        </p>
      </div>

      <ContactMessagesPageClient
        page={page}
        search={search}
        status={status}
        assigneeId={assigneeId}
      />
    </div>
  )
}
