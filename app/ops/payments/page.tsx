import { PaymentsPageClient } from "./_components/payments-page-client"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = (params.tab as string) || "all"
  const page = Number(params.page) || 1
  const status = typeof params.status === "string" ? params.status : undefined
  const method = typeof params.method === "string" ? params.method : undefined
  const search = typeof params.search === "string" ? params.search : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage payment transactions and verify bank transfers
        </p>
      </div>

      <PaymentsPageClient
        tab={tab}
        page={page}
        status={status}
        method={method}
        search={search}
      />
    </div>
  )
}
