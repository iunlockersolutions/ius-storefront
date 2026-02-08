"use client"

import { useState } from "react"

import { ChevronDown, ChevronUp, Key, Lock, Shield } from "lucide-react"

import { PasskeyManager } from "@/components/shared/passkey-manager"
import { PasswordChangeForm } from "@/components/shared/password-change-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { authClient } from "@/lib/auth-client"

interface SecuritySectionProps {
  userEmail: string
  userName?: string
  lastPasswordChange?: Date | null
}

/**
 * Customer Profile Security Section
 *
 * Collapsible security section for customer profiles that includes:
 * - Password change form
 * - Passkey management
 */
export function SecuritySection({
  userEmail,
  userName,
  lastPasswordChange,
}: SecuritySectionProps) {
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isPasskeyOpen, setIsPasskeyOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Security</CardTitle>
        </div>
        <CardDescription>
          Manage your password and passkeys for secure account access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Password Section */}
        <Collapsible open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    {lastPasswordChange
                      ? `Last changed ${new Date(lastPasswordChange).toLocaleDateString()}`
                      : "Change your account password"}
                  </p>
                </div>
              </div>
              {isPasswordOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="rounded-lg border p-4">
              <PasswordChangeForm
                onSubmit={async (data) => {
                  const result = await authClient.changePassword({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                  })

                  if (result.error) {
                    return {
                      success: false,
                      error:
                        result.error.message || "Failed to change password",
                    }
                  }

                  return { success: true }
                }}
                userEmail={userEmail}
                userName={userName}
                submitText="Update Password"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Passkey Section */}
        <Collapsible open={isPasskeyOpen} onOpenChange={setIsPasskeyOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Key className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Passkeys</p>
                  <p className="text-sm text-muted-foreground">
                    Sign in without a password using biometrics
                  </p>
                </div>
              </div>
              {isPasskeyOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="rounded-lg border p-4">
              <PasskeyManager />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
