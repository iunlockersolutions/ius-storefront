"use client"

import { useRouter } from "next/navigation"

import { Lock } from "lucide-react"

import { PasswordChangeForm } from "@/components/shared/password-change-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { changePassword } from "@/lib/actions/staff-profile"

interface SecurityPasswordProps {
  userInfo?: {
    email: string
    name?: string
  }
}

export function SecurityPassword({ userInfo }: SecurityPasswordProps) {
  const router = useRouter()

  const handlePasswordChange = async (data: {
    currentPassword: string
    newPassword: string
  }) => {
    const result = await changePassword(data)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-w-md">
          <PasswordChangeForm
            onSubmit={handlePasswordChange}
            userEmail={userInfo?.email}
            userName={userInfo?.name}
            onSuccess={() => {
              // Could show a toast notification here
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
