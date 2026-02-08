"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { handlePostLoginRedirect } from "@/lib/actions/admin-auth"
import { authClient } from "@/lib/auth-client"

/**
 * Auth Callback Content Component
 *
 * Handles the actual redirect logic.
 */
function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Completing sign in...")

  useEffect(() => {
    async function handleCallback() {
      try {
        const callbackUrl = searchParams.get("callbackUrl") || "/"

        setStatus("Redirecting...")

        // Use server action for redirect - it will handle role checking
        const result = await handlePostLoginRedirect(callbackUrl)

        // If we get here, user is banned (redirect throws, so we only get result on error)
        if (result?.error === "banned") {
          await authClient.signOut()
          toast.error(
            result.banReason
              ? `Your account has been suspended: ${result.banReason}`
              : "Your account has been suspended. Please contact an administrator.",
          )
          // Redirect to login after showing error
          window.location.href = "/auth/login"
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        toast.error("An error occurred during sign in")
        window.location.href = "/auth/login"
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">{status}</p>
    </div>
  )
}

/**
 * Auth Callback Page
 *
 * This page handles post-authentication redirect logic.
 * It checks the user's role and redirects accordingly:
 * - Staff users → /admin (or /admin/change-password if needed)
 * - Regular customers → original callbackUrl or /
 *
 * Used by:
 * - Social login (Google, GitHub)
 * - Any auth flow that needs role-based redirect
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
