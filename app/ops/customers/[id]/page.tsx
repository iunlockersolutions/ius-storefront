import { redirect } from "next/navigation"

import { CustomerDetailPageClient } from "@/components/admin/customers/customer-detail-page-client"
import { requireStaff } from "@/lib/auth/rbac"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  try {
    await requireStaff()
  } catch {
    redirect("/auth/login")
  }

  const { id } = await params

  return <CustomerDetailPageClient customerId={id} />
}
