"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  ArrowLeft,
  Ban,
  Calendar,
  Edit2,
  Key,
  Loader2,
  Lock,
  Mail,
  MonitorSmartphone,
  Shield,
  Trash2,
  Unlock,
  User,
} from "lucide-react"
import { z } from "zod"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  banStaffUser,
  deleteStaffUser,
  resetStaffPassword,
  unbanStaffUser,
  updateStaffUser,
} from "@/lib/actions/admin-users"

import { UserActivityLog } from "./user-activity-log"
import { UserSessionsTable } from "./user-sessions-table"

type StaffRole = "admin" | "manager" | "support"

interface StaffUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string | null
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
  emailVerified: boolean
  invitedBy: string | null
  invitedAt: Date | null
  lastPasswordChange: Date | null
  mustChangePassword: boolean | null
  inviter: {
    id: string
    name: string | null
    email: string
  } | null
}

interface Session {
  id: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

interface ActivityLog {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["admin", "manager", "support"]),
})

type UpdateValues = z.infer<typeof updateSchema>

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  manager: "bg-orange-100 text-orange-700 border-orange-200",
  support: "bg-blue-100 text-blue-700 border-blue-200",
}

interface StaffUserDetailProps {
  user: StaffUser
  sessions: Session[]
  activities: ActivityLog[]
  isCurrentUser: boolean
  canEdit: boolean
}

export function StaffUserDetail({
  user: staffUser,
  sessions,
  activities,
  isCurrentUser,
  canEdit,
}: StaffUserDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const form = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: staffUser.name || "",
      role: (staffUser.role as StaffRole) || "support",
    },
  })

  async function onSubmit(data: UpdateValues) {
    setLoading(true)
    setError(null)

    try {
      const result = await updateStaffUser({
        id: staffUser.id,
        ...data,
      })

      if (!result.success) {
        setError(result.error || "Failed to update user")
        return
      }

      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleBan() {
    setActionLoading(true)
    try {
      const result = await banStaffUser(staffUser.id)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || "Failed to ban user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban user")
    } finally {
      setActionLoading(false)
      setBanDialogOpen(false)
    }
  }

  async function handleUnban() {
    setActionLoading(true)
    try {
      const result = await unbanStaffUser(staffUser.id)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || "Failed to unban user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unban user")
    } finally {
      setActionLoading(false)
      setUnbanDialogOpen(false)
    }
  }

  async function handleResetPassword() {
    setActionLoading(true)
    try {
      const result = await resetStaffPassword(staffUser.id)
      if (!result.success) {
        setError(result.error || "Failed to reset password")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setActionLoading(false)
      setResetPasswordDialogOpen(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      const result = await deleteStaffUser(staffUser.id)
      if (result.success) {
        router.push("/admin/users")
      } else {
        setError(result.error || "Failed to delete user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setActionLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/users")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Button>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* User Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                {staffUser.image ? (
                  <img
                    src={staffUser.image}
                    alt={staffUser.name || ""}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium">
                    {(staffUser.name || staffUser.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {staffUser.name || "No name"}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {staffUser.email}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={roleColors[staffUser.role || "support"]}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    <span className="capitalize">{staffUser.role}</span>
                  </Badge>
                  {staffUser.banned ? (
                    <Badge variant="destructive">
                      <Ban className="mr-1 h-3 w-3" />
                      Banned
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {canEdit && !isCurrentUser && !editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <MonitorSmartphone className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>
                  View and manage user information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      label="Name"
                      error={form.formState.errors.name?.message}
                      required
                    >
                      <Input {...form.register("name")} />
                    </FormField>

                    <FormField
                      label="Role"
                      error={form.formState.errors.role?.message}
                      required
                    >
                      <Select
                        value={form.watch("role")}
                        onValueChange={(value) =>
                          form.setValue("role", value as StaffRole)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Status badges */}
                    {staffUser.mustChangePassword && (
                      <Badge variant="secondary">Must Change Password</Badge>
                    )}

                    {/* Ban reason */}
                    {staffUser.banned && staffUser.banReason && (
                      <div className="rounded-lg bg-destructive/10 p-3">
                        <p className="text-sm font-medium text-destructive">
                          Ban Reason:
                        </p>
                        <p className="text-sm text-destructive/80 mt-1">
                          {staffUser.banReason}
                        </p>
                      </div>
                    )}

                    {/* Details grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Joined</p>
                          <p className="font-medium">
                            {new Date(staffUser.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {staffUser.lastPasswordChange && (
                        <div className="flex items-center gap-3 text-sm">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">
                              Last Password Change
                            </p>
                            <p className="font-medium">
                              {new Date(
                                staffUser.lastPasswordChange,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {staffUser.inviter && (
                        <div className="flex items-center gap-3 text-sm sm:col-span-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Invited By</p>
                            <p className="font-medium">
                              {staffUser.inviter.name ||
                                staffUser.inviter.email}
                              {staffUser.invitedAt && (
                                <span className="text-muted-foreground ml-2">
                                  on{" "}
                                  {new Date(
                                    staffUser.invitedAt,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Sessions
                  </span>
                  <Badge variant="secondary">{sessions.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Recent Activities
                  </span>
                  <Badge variant="secondary">{activities.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Email Verified
                  </span>
                  <Badge
                    variant={staffUser.emailVerified ? "default" : "secondary"}
                  >
                    {staffUser.emailVerified ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent actions performed by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserActivityLog activities={activities} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage this user&apos;s active sessions and devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserSessionsTable sessions={sessions} userId={staffUser.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          {canEdit && !isCurrentUser ? (
            <Card>
              <CardHeader>
                <CardTitle>Security Actions</CardTitle>
                <CardDescription>
                  Manage security settings for this user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Reset Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Send a new temporary password to the user&apos;s email
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setResetPasswordDialogOpen(true)}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {staffUser.banned ? "Unban User" : "Ban User"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {staffUser.banned
                          ? "Allow this user to sign in again"
                          : "Prevent this user from signing in"}
                      </p>
                    </div>
                    {staffUser.banned ? (
                      <Button
                        variant="outline"
                        onClick={() => setUnbanDialogOpen(true)}
                      >
                        <Unlock className="mr-2 h-4 w-4" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="text-orange-600 hover:text-orange-700"
                        onClick={() => setBanDialogOpen(true)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Ban
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-destructive/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-destructive">
                        Delete User
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this user account
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>
                    {isCurrentUser
                      ? "You cannot perform security actions on your own account"
                      : "You don't have permission to manage security settings"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {staffUser.name || staffUser.email}?
              They will be logged out and unable to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={actionLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban Dialog */}
      <AlertDialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban {staffUser.name || staffUser.email}
              ? They will be able to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnban} disabled={actionLoading}>
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Unban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a new temporary password to {staffUser.email}. They
              will be required to change it on their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {staffUser.name || staffUser.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
