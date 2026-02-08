"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  Loader2,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  revokeAllUserSessions,
  revokeUserSession,
} from "@/lib/actions/admin-users"

interface Session {
  id: string
  createdAt: Date
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
}

interface UserSessionsTableProps {
  sessions: Session[]
  userId: string
  userName?: string
  canManage?: boolean
}

function parseUserAgent(ua: string | null): {
  device: "desktop" | "tablet" | "mobile" | "unknown"
  browser: string
  os: string
} {
  if (!ua) {
    return { device: "unknown", browser: "Unknown", os: "Unknown" }
  }

  let device: "desktop" | "tablet" | "mobile" | "unknown" = "desktop"
  let browser = "Unknown"
  let os = "Unknown"

  // Detect device type
  if (/mobile/i.test(ua)) {
    device = "mobile"
  } else if (/tablet|ipad/i.test(ua)) {
    device = "tablet"
  }

  // Detect browser
  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) {
    browser = "Chrome"
  } else if (/firefox/i.test(ua)) {
    browser = "Firefox"
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari"
  } else if (/edge|edg/i.test(ua)) {
    browser = "Edge"
  } else if (/opera|opr/i.test(ua)) {
    browser = "Opera"
  }

  // Detect OS
  if (/windows/i.test(ua)) {
    os = "Windows"
  } else if (/mac os|macos/i.test(ua)) {
    os = "macOS"
  } else if (/linux/i.test(ua)) {
    os = "Linux"
  } else if (/android/i.test(ua)) {
    os = "Android"
  } else if (/ios|iphone|ipad/i.test(ua)) {
    os = "iOS"
  }

  return { device, browser, os }
}

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />
    case "tablet":
      return <Tablet className="h-4 w-4" />
    default:
      return <Monitor className="h-4 w-4" />
  }
}

export function UserSessionsTable({
  sessions,
  userId,
  userName = "this user",
  canManage = true,
}: UserSessionsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const handleRevokeSession = (sessionId: string) => {
    setSelectedSession(sessionId)
    setRevokeDialogOpen(true)
  }

  const confirmRevokeSession = () => {
    if (!selectedSession) return

    startTransition(async () => {
      await revokeUserSession(selectedSession, userId)
      setRevokeDialogOpen(false)
      setSelectedSession(null)
      router.refresh()
    })
  }

  const confirmRevokeAllSessions = () => {
    startTransition(async () => {
      await revokeAllUserSessions(userId)
      setRevokeAllDialogOpen(false)
      router.refresh()
    })
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Monitor className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p>No active sessions found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canManage && sessions.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevokeAllDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Revoke All Sessions
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              {canManage && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const { device, browser, os } = parseUserAgent(session.userAgent)
              const isExpired = new Date(session.expiresAt) < new Date()

              return (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <DeviceIcon device={device} />
                      </div>
                      <div>
                        <p className="font-medium">{browser}</p>
                        <p className="text-xs text-muted-foreground">{os}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {session.ipAddress || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {new Date(session.createdAt).toLocaleDateString()}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : (
                        <>
                          {new Date(session.expiresAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.expiresAt).toLocaleTimeString()}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={isPending}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Single Session Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The user will be
              logged out from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeSession}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog
        open={revokeAllDialogOpen}
        onOpenChange={setRevokeAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke all sessions for {userName}? They
              will be logged out from all devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAllSessions}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke All Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
