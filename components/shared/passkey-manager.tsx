"use client"

import { useCallback, useEffect, useState } from "react"

import {
  Fingerprint,
  Key,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Shield,
  Smartphone,
  Trash2,
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

import { PasskeyRegisterDialog } from "./passkey-register-dialog"

interface Passkey {
  id: string
  name?: string | null
  credentialID: string
  deviceType: string
  createdAt: Date | null
}

function getDeviceIcon(deviceType: string) {
  switch (deviceType.toLowerCase()) {
    case "platform":
      return <Monitor className="h-5 w-5" />
    case "cross-platform":
      return <Key className="h-5 w-5" />
    default:
      return <Smartphone className="h-5 w-5" />
  }
}

function getDeviceLabel(deviceType: string) {
  switch (deviceType.toLowerCase()) {
    case "platform":
      return "Built-in Authenticator"
    case "cross-platform":
      return "Security Key"
    default:
      return "Unknown Device"
  }
}

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPasskey, setEditingPasskey] = useState<Passkey | null>(null)
  const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null)
  const [editName, setEditName] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPasskeys = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await authClient.passkey.listUserPasskeys()

      if (result.error) {
        setError(result.error.message || "Failed to load passkeys")
        return
      }

      setPasskeys(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load passkeys")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPasskeys()
  }, [fetchPasskeys])

  const handleDelete = async () => {
    if (!passkeyToDelete) return

    setActionLoading(true)
    try {
      const result = await authClient.passkey.deletePasskey({
        id: passkeyToDelete.id,
      })

      if (result.error) {
        setError(result.error.message || "Failed to delete passkey")
        return
      }

      setPasskeys((prev) => prev.filter((p) => p.id !== passkeyToDelete.id))
      setDeleteDialogOpen(false)
      setPasskeyToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete passkey")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRename = async () => {
    if (!editingPasskey || !editName.trim()) return

    setActionLoading(true)
    try {
      const result = await authClient.passkey.updatePasskey({
        id: editingPasskey.id,
        name: editName.trim(),
      })

      if (result.error) {
        setError(result.error.message || "Failed to rename passkey")
        return
      }

      setPasskeys((prev) =>
        prev.map((p) =>
          p.id === editingPasskey.id ? { ...p, name: editName.trim() } : p,
        ),
      )
      setEditingPasskey(null)
      setEditName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename passkey")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>
                Manage your passwordless login methods
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setRegisterDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Passkey
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
            <Shield className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No passkeys registered</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a passkey to sign in without a password
            </p>
            <Button
              className="mt-4"
              onClick={() => setRegisterDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Passkey
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    {getDeviceIcon(passkey.deviceType)}
                  </div>
                  <div>
                    {editingPasskey?.id === passkey.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-48"
                          placeholder="Enter new name"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename()
                            if (e.key === "Escape") {
                              setEditingPasskey(null)
                              setEditName("")
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleRename}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPasskey(null)
                            setEditName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">
                          {passkey.name || "Unnamed Passkey"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getDeviceLabel(passkey.deviceType)}
                          {passkey.createdAt && (
                            <>
                              {" · Added "}
                              {new Date(passkey.createdAt).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {!editingPasskey && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPasskey(passkey)
                        setEditName(passkey.name || "")
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Rename</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setPasskeyToDelete(passkey)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Register Dialog */}
        <PasskeyRegisterDialog
          open={registerDialogOpen}
          onOpenChange={setRegisterDialogOpen}
          onSuccess={fetchPasskeys}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Passkey</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;
                {passkeyToDelete?.name || "this passkey"}&quot;? You won&apos;t
                be able to use it to sign in anymore.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setPasskeyToDelete(null)
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
