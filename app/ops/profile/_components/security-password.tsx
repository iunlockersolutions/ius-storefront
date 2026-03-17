"use client"

import { Lock } from "lucide-react"

import { PasswordChangeForm } from "@/components/shared/password-change-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useChangePasswordMutation } from "@/services/mutations/use-profile-mutations"

interface SecurityPasswordProps {
  userInfo?: {
    email: string
    name?: string
  }
}

export function SecurityPassword({ userInfo }: SecurityPasswordProps) {
  const changePasswordMutation = useChangePasswordMutation()

  const handlePasswordChange = async (data: {
    currentPassword: string
    newPassword: string
  }) => {
    try {
      await changePasswordMutation.mutateAsync(data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to change password",
      }
    }
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
