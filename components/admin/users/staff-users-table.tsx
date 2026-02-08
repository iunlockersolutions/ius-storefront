"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import {
  Ban,
  Eye,
  Key,
  Loader2,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  banStaffUser,
  deleteStaffUser,
  listStaffUsers,
  resetStaffPassword,
  unbanStaffUser,
} from "@/lib/actions/admin-users"

type StaffRole = "admin" | "manager" | "support"

interface StaffUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string | null
  banned: boolean | null
  banReason: string | null
  createdAt: Date
  emailVerified: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  manager: "bg-orange-100 text-orange-700 border-orange-200",
  support: "bg-blue-100 text-blue-700 border-blue-200",
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-3 w-3" />,
  manager: <Shield className="h-3 w-3" />,
  support: <Shield className="h-3 w-3" />,
}

export function StaffUsersTable({ currentUserId }: { currentUserId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<StaffUser[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">(
    (searchParams.get("role") as StaffRole) || "all",
  )

  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await listStaffUsers({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        page: parseInt(searchParams.get("page") || "1"),
      })

      setUsers(result.users)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, searchParams])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  function updateSearchParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    router.push(`?${params.toString()}`)
  }

  async function handleBan() {
    if (!selectedUser) return

    setActionLoading(true)
    try {
      const result = await banStaffUser(selectedUser.id)
      if (result.success) {
        await fetchUsers()
      } else {
        setError(result.error || "Failed to ban user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban user")
    } finally {
      setActionLoading(false)
      setBanDialogOpen(false)
      setSelectedUser(null)
    }
  }

  async function handleUnban() {
    if (!selectedUser) return

    setActionLoading(true)
    try {
      const result = await unbanStaffUser(selectedUser.id)
      if (result.success) {
        await fetchUsers()
      } else {
        setError(result.error || "Failed to unban user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unban user")
    } finally {
      setActionLoading(false)
      setUnbanDialogOpen(false)
      setSelectedUser(null)
    }
  }

  async function handleResetPassword() {
    if (!selectedUser) return

    setActionLoading(true)
    try {
      const result = await resetStaffPassword(selectedUser.id)
      if (result.success) {
        // Show success message somehow
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setActionLoading(false)
      setResetPasswordDialogOpen(false)
      setSelectedUser(null)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return

    setActionLoading(true)
    try {
      const result = await deleteStaffUser(selectedUser.id)
      if (result.success) {
        await fetchUsers()
      } else {
        setError(result.error || "Failed to delete user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setActionLoading(false)
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Staff Users</CardTitle>
              <CardDescription>
                Manage staff accounts and permissions
              </CardDescription>
            </div>
          </div>
          <Button asChild>
            <Link href="/admin/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Staff
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateSearchParams({ search: search || null, page: "1" })
                }
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value as StaffRole | "all")
              updateSearchParams({
                role: value !== "all" ? value : null,
                page: "1",
              })
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No staff users found</h3>
            <p className="mt-2 text-muted-foreground">
              {search || roleFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by inviting your first staff member"}
            </p>
            {!search && roleFilter === "all" && (
              <Button asChild className="mt-4">
                <Link href="/admin/users/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Staff
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || ""}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-medium">
                                {(user.name || user.email)[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.name || "No name"}
                              {user.id === currentUserId && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant="outline"
                          className={roleColors[user.role || "support"]}
                        >
                          {roleIcons[user.role || "support"]}
                          <span className="ml-1 capitalize">
                            {user.role || "support"}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-4">
                        {user.banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-200"
                          >
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={user.id === currentUserId}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setResetPasswordDialogOpen(true)
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.banned ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setUnbanDialogOpen(true)
                                }}
                              >
                                <Unlock className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setBanDialogOpen(true)
                                }}
                                className="text-orange-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      updateSearchParams({
                        page: String(pagination.page - 1),
                      })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      updateSearchParams({
                        page: String(pagination.page + 1),
                      })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Ban Dialog */}
        <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ban User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to ban{" "}
                {selectedUser?.name || selectedUser?.email}? They will be logged
                out and unable to sign in.
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
                Are you sure you want to unban{" "}
                {selectedUser?.name || selectedUser?.email}? They will be able
                to sign in again.
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
                This will send a new temporary password to {selectedUser?.email}
                . They will be required to change it on their next login.
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
                {selectedUser?.name || selectedUser?.email}? This action cannot
                be undone.
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
      </CardContent>
    </Card>
  )
}
