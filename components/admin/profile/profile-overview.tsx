"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Loader2, Mail, Shield, User } from "lucide-react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStaffProfile } from "@/lib/actions/staff-profile"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileOverviewProps {
  user: {
    id: string
    name: string
    email: string
    image: string | null
    role: "admin" | "manager" | "support"
    createdAt: Date
    lastPasswordChange: Date | null
  }
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "destructive"
    case "manager":
      return "default"
    case "support":
      return "secondary"
    default:
      return "outline"
  }
}

export function ProfileOverview({ user }: ProfileOverviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
    },
  })

  const handleSave = async (data: ProfileFormData) => {
    setError(null)
    setSuccess(false)

    const result = await updateStaffProfile(data)

    if (result.success) {
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || "Failed to update profile")
    }
  }

  const handleCancel = () => {
    reset({ name: user.name })
    setIsEditing(false)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal details and account information
              </CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <>
                <Input id="name" {...register("name")} className="max-w-md" />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg font-medium">{user.name}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Created</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    dateStyle: "long",
                  })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Password Change</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {user.lastPasswordChange
                    ? new Date(user.lastPasswordChange).toLocaleDateString(
                        "en-US",
                        { dateStyle: "long" },
                      )
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
