import { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { eq } from "drizzle-orm"

import { StaffUserDetail } from "@/components/admin/users/staff-user-detail"
import {
  getStaffUser,
  getStaffUserActivity,
  getStaffUserSessions,
} from "@/lib/actions/admin-users"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema/auth"

export const metadata: Metadata = {
  title: "User Details | Admin",
  description: "View and manage staff user details",
}

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function StaffUserDetailPage({ params }: PageProps) {
  const { userId } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/admin/login")
  }

  // Get current user role
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  })

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "manager")
  ) {
    redirect("/admin")
  }

  // Fetch all data in parallel
  const [staffUser, sessions, activities] = await Promise.all([
    getStaffUser(userId),
    getStaffUserSessions(userId),
    getStaffUserActivity(userId, 50),
  ])

  if (!staffUser) {
    notFound()
  }

  const isCurrentUser = session.user.id === staffUser.id
  const canEdit = currentUser.role === "admin"

  return (
    <StaffUserDetail
      user={{
        ...staffUser,
        createdAt: new Date(staffUser.createdAt),
        invitedAt: staffUser.invitedAt ? new Date(staffUser.invitedAt) : null,
        lastPasswordChange: staffUser.lastPasswordChange
          ? new Date(staffUser.lastPasswordChange)
          : null,
        banExpires: staffUser.banExpires
          ? new Date(staffUser.banExpires)
          : null,
        inviter: staffUser.inviter ?? null,
      }}
      sessions={sessions}
      activities={activities}
      isCurrentUser={isCurrentUser}
      canEdit={canEdit}
    />
  )
}
