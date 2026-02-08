"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { AlertTriangle, Loader2, Shield } from "lucide-react"

import { PasswordChangeForm } from "@/components/shared/password-change-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { changeFirstTimePassword } from "@/lib/actions/admin-auth"
import { authClient } from "@/lib/auth-client"

interface FirstTimePasswordChangeProps {
  userEmail: string
  userName?: string | null
}

export function FirstTimePasswordChange({
  userEmail,
  userName,
}: FirstTimePasswordChangeProps) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Password Changed!</h3>
            <p className="text-muted-foreground">
              Your password has been updated successfully. Redirecting to the
              admin panel...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle className="text-2xl">Change Your Password</CardTitle>
        <CardDescription>
          You must change your temporary password before you can access the
          admin panel. Please create a strong, unique password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordChangeForm
          onSubmit={async (data) => {
            const result = await changeFirstTimePassword(
              data.currentPassword,
              data.newPassword,
            )
            if (result.success) {
              setSuccess(true)
              setTimeout(() => {
                router.push("/admin")
                router.refresh()
              }, 2000)
            }
            return result
          }}
          userEmail={userEmail}
          userName={userName || undefined}
          submitText="Set New Password"
        />

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground"
          >
            Sign out and return later
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
