import { InstallmentPlansPageClient } from "./_components/installment-plans-page-client"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata = {
  title: "Installment Plans | Operations",
  description: "Manage 0% installment plan notices",
}

export default async function InstallmentPlansPage({
  searchParams,
}: PageProps) {
  const params = await searchParams

  return (
    <InstallmentPlansPageClient
      page={Number(params.page) || 1}
      status={typeof params.status === "string" ? params.status : "all"}
      search={typeof params.search === "string" ? params.search : undefined}
    />
  )
}
