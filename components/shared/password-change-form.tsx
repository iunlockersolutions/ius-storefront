"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  containsUserInfo,
  passwordRequirements,
  validatePassword,
} from "@/lib/utils/password-requirements"

import { PasswordStrengthIndicator } from "./password-strength-indicator"

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(
        passwordRequirements.minLength,
        `Password must be at least ${passwordRequirements.minLength} characters`,
      )
      .refine(
        (val) => validatePassword(val).valid,
        (val) => ({
          message: validatePassword(val).errors[0] || "Invalid password",
        }),
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

interface PasswordChangeFormProps {
  /**
   * Called when the form is submitted successfully
   */
  onSubmit: (data: {
    currentPassword: string
    newPassword: string
  }) => Promise<{ success: boolean; error?: string }>
  /**
   * User email to check if password contains it
   */
  userEmail?: string
  /**
   * User name to check if password contains it
   */
  userName?: string
  /**
   * Hide the current password field (for first-time password change)
   */
  hideCurrentPassword?: boolean
  /**
   * Submit button text
   */
  submitText?: string
  /**
   * Called after successful submission
   */
  onSuccess?: () => void
}

export function PasswordChangeForm({
  onSubmit,
  userEmail,
  userName,
  hideCurrentPassword = false,
  submitText = "Change Password",
  onSuccess,
}: PasswordChangeFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: hideCurrentPassword ? "placeholder" : "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const newPassword = watch("newPassword")

  const handleFormSubmit = async (data: PasswordChangeFormData) => {
    setError(null)

    // Additional validation: check if password contains user info
    if (containsUserInfo(data.newPassword, userEmail, userName)) {
      setError("Password should not contain your email or name")
      return
    }

    const result = await onSubmit({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })

    if (result.success) {
      reset()
      onSuccess?.()
    } else {
      setError(result.error || "Failed to change password")
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Current Password */}
      {!hideCurrentPassword && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              className="pl-9 pr-10"
              {...register("currentPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.currentPassword && (
            <p className="text-sm text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            className="pl-9 pr-10"
            {...register("newPassword")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-destructive">
            {errors.newPassword.message}
          </p>
        )}
        <PasswordStrengthIndicator password={newPassword} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className="pl-9 pr-10"
            {...register("confirmPassword")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Changing Password...
          </>
        ) : (
          submitText
        )}
      </Button>
    </form>
  )
}
