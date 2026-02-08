import { redirect } from "next/navigation"

import { CustomersTable } from "@/components/admin/customers/customers-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCustomers } from "@/lib/actions/customer"
import { requireStaff } from "@/lib/auth/rbac"

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  try {
    await requireStaff()
  } catch {
    redirect("/auth/login")
  }

  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ""

  const { customers, pagination } = await getCustomers({ page, search })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground">
          Manage customer accounts and view their activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersTable
            customers={customers}
            pagination={pagination}
            search={search}
          />
        </CardContent>
      </Card>
    </div>
  )
}
