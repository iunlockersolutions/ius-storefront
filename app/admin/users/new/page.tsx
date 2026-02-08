import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { eq } from "drizzle-orm"

import { CreateStaffForm } from "@/components/admin/users/create-staff-form"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema/auth"

export const metadata: Metadata = {
  title: "Invite Staff | Admin",
  description: "Invite a new staff member to the admin panel",
}

export default async function NewStaffPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/admin/login")
  }

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
