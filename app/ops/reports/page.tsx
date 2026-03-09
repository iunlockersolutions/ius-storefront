import { ReportsPageClient } from "@/components/admin/reports/reports-page-client"

interface ReportsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams
  const tab = params.tab || "sales"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Insights into your store&apos;s performance
        </p>
      </div>

      <ReportsPageClient tab={tab} />
    </div>
  )
}
