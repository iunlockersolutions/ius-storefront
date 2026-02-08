"use client"

import { useEffect, useState } from "react"

import {
  Laptop,
  Loader2,
  LogOut,
  MapPin,
  Monitor,
  Smartphone,
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
  getUserSessions,
  revokeAllOtherSessions,
  revokeSession,
} from "@/lib/actions/staff-profile"

interface Session {
  id: string
  token: string
  createdAt: Date
  expiresAt: Date
  ipAddress: string | null | undefined
  userAgent: string | null | undefined
  isCurrent: boolean
}

function parseUserAgent(userAgent: string | null): {
  browser: string
  os: string
  device: "desktop" | "mobile" | "tablet"
} {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown", device: "desktop" }
  }

  // Simple parsing - could use a library for more accuracy
  let browser = "Unknown"
  let os = "Unknown"
  let device: "desktop" | "mobile" | "tablet" = "desktop"

  // Browser detection
  if (userAgent.includes("Chrome")) browser = "Chrome"
  else if (userAgent.includes("Firefox")) browser = "Firefox"
  else if (userAgent.includes("Safari")) browser = "Safari"
  else if (userAgent.includes("Edge")) browser = "Edge"

  // OS detection
  if (userAgent.includes("Windows")) os = "Windows"
  else if (userAgent.includes("Mac")) os = "macOS"
  else if (userAgent.includes("Linux")) os = "Linux"
  else if (userAgent.includes("Android")) {
    os = "Android"
    device = "mobile"
  } else if (userAgent.includes("iPhone")) {
    os = "iOS"
    device = "mobile"
  } else if (userAgent.includes("iPad")) {
    os = "iPadOS"
    device = "tablet"
  }

  return { browser, os, device }
}

function getDeviceIcon(device: "desktop" | "mobile" | "tablet") {
  switch (device) {
    case "mobile":
      return <Smartphone className="h-5 w-5" />
    case "tablet":
      return <Laptop className="h-5 w-5" />
    default:
      return <Monitor className="h-5 w-5" />
  }
}

export function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false)
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      setLoading(true)
      const data = await getUserSessions()
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke() {
    if (!sessionToRevoke) return

    setActionLoading(true)
    try {
      const result = await revokeSession(sessionToRevoke.token)
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionToRevoke.id))
      } else {
        setError(result.error || "Failed to revoke session")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session")
    } finally {
      setActionLoading(false)
      setRevokeDialogOpen(false)
      setSessionToRevoke(null)
    }
  }

  async function handleRevokeAll() {
    setActionLoading(true)
    try {
      const result = await revokeAllOtherSessions()
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent))
      } else {
        setError(result.error || "Failed to revoke sessions")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke sessions")
    } finally {
      setActionLoading(false)
      setRevokeAllDialogOpen(false)
    }
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions across devices
              </CardDescription>
            </div>
          </div>
          {otherSessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokeAllDialogOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out all other devices
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

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No active sessions found
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const { browser, os, device } = parseUserAgent(
                session.userAgent ?? null,
              )
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      {getDeviceIcon(device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {browser} on {os}
                        </p>
                        {session.isCurrent && (
                          <Badge variant="secondary">Current Session</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {session.ipAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.ipAddress}
                          </span>
                        )}
                        <span>
                          Started{" "}
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSessionToRevoke(session)
                        setRevokeDialogOpen(true)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Revoke Single Session Dialog */}
        <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out this device?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end the session on this device. You&apos;ll need to
                sign in again if you want to use it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                disabled={actionLoading}
              >
                {actionLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign out
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
              <AlertDialogTitle>Sign out all other devices?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end all sessions except your current one. You&apos;ll
                need to sign in again on those devices.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevokeAll}
                disabled={actionLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {actionLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign out all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
