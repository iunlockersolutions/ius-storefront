import { Metadata } from "next"
import Link from "next/link"

import { ArrowLeft } from "lucide-react"

import { RolesTable } from "@/components/admin/users/roles-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { requireAdminAccessOrRedirect } from "../_actions/access"

export const metadata: Metadata = {
  title: "Roles & Permissions | Ops",
  description: "View and manage staff roles and permissions",
}

export default async function RolesPage() {
  await requireAdminAccessOrRedirect()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/ops/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground mt-1">
            View the permission structure for each staff role
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Definitions</CardTitle>
          <CardDescription>
            Each role has specific permissions that determine what actions users
            can perform in the operations area. Roles follow the principle of
            least privilege - each role only has the permissions needed for its
            function.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Legend</CardTitle>
          <CardDescription>Understanding the permission system</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Resources</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Products</strong> - Create, edit, delete products
                </li>
                <li>
                  <strong>Categories</strong> - Manage product categories
                </li>
                <li>
                  <strong>Orders</strong> - View and manage customer orders
                </li>
                <li>
                  <strong>Inventory</strong> - Track and adjust stock levels
                </li>
                <li>
                  <strong>Payments</strong> - Verify and manage payments
                </li>
                <li>
                  <strong>Reviews</strong> - Moderate customer reviews
                </li>
                <li>
                  <strong>Customers</strong> - View customer information
                </li>
                <li>
                  <strong>Staff</strong> - Manage staff user accounts
                </li>
                <li>
                  <strong>Settings</strong> - Configure store settings
                </li>
                <li>
                  <strong>Reports</strong> - Access analytics and reports
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Actions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Create</strong> - Add new items
                </li>
                <li>
                  <strong>Read</strong> - View items
                </li>
                <li>
                  <strong>Update</strong> - Modify existing items
                </li>
                <li>
                  <strong>Delete</strong> - Remove items
                </li>
                <li>
                  <strong>List</strong> - View item listings
                </li>
                <li>
                  <strong>Verify</strong> - Verify payments
                </li>
                <li>
                  <strong>Approve/Reject</strong> - Moderate content
                </li>
                <li>
                  <strong>Ban</strong> - Restrict user access
                </li>
                <li>
                  <strong>Invite</strong> - Send user invitations
                </li>
                <li>
                  <strong>Export</strong> - Export data to files
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
