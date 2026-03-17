import { redirect } from "next/navigation"

import { requireStaff } from "@/lib/auth/rbac"

import { CustomerDetailPageClient } from "../_components/customer-detail-page-client"

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
