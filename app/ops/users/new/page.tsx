import { Metadata } from "next"

import { CreateStaffForm } from "@/components/admin/users/create-staff-form"

import { requireAuthenticatedAdminUserOrRedirect } from "../_actions/access"

export const metadata: Metadata = {
  title: "Invite Staff | Ops",
  description: "Invite a new staff member to the operations area",
}

export default async function NewStaffPage() {
  await requireAuthenticatedAdminUserOrRedirect()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Invite Staff Member
        </h1>
        <p className="text-muted-foreground">
          Send an invitation to a new staff member with their role and
          permissions
        </p>
      </div>

      <CreateStaffForm />
    </div>
  )
}
