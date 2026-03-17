import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { StaffUserDetail } from "@/app/ops/users/_components/staff-user-detail"
import {
  getStaffUser,
  getStaffUserActivity,
  getStaffUserSessions,
} from "@/lib/actions/admin-users"

import { requireAdminOrManagerAccessOrRedirect } from "../_actions/access"

export const metadata: Metadata = {
  title: "User Details | Ops",
  description: "View and manage staff user details",
}

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function StaffUserDetailPage({ params }: PageProps) {
  const { userId } = await params
  const { session, canEdit } = await requireAdminOrManagerAccessOrRedirect()

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
