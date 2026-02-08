import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { CustomerDetail } from "@/components/admin/customers/customer-detail"
import { Button } from "@/components/ui/button"
import {
  getAllRoles,
  getCustomer,
  getCustomerOrders,
} from "@/lib/actions/customer"
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

  const [customer, ordersData, allRoles] = await Promise.all([
    getCustomer(id),
    getCustomerOrders(id),
    getAllRoles(),
  ])

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {customer.user.name || customer.user.email}
          </h1>
          <p className="text-muted-foreground">Customer Details</p>
        </div>
      </div>

      <CustomerDetail
        customer={customer}
        orders={ordersData.orders}
        ordersPagination={ordersData.pagination}
        allRoles={allRoles}
      />
    </div>
  )
}
