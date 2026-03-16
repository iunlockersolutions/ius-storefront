"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Fingerprint, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

interface PasskeySignInButtonProps {
  callbackUrl?: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
  onSuccess?: () => void | Promise<void>
}

/**
 * Passkey Sign-In Button
 *
 * Allows users to sign in using a registered passkey (WebAuthn).
 * Uses BetterAuth's passkey client for authentication.
 */
export function PasskeySignInButton({
  callbackUrl = "/",
  className,
  variant = "outline",
  size = "default",
  disabled = false,
  onSuccess,
}: PasskeySignInButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handlePasskeySignIn() {
    setIsLoading(true)

    try {
      const result = await authClient.signIn.passkey()

      if (result?.error) {
        // Handle specific error cases
        if (result.error.message?.includes("not found")) {
          toast.error("No passkey found. Please sign in with your password.")
        } else if (result.error.message?.includes("cancelled")) {
          // User cancelled the operation - don't show error
          return
        } else {
          toast.error(result.error.message || "Failed to sign in with passkey")
        }
        return
      }

      // If onSuccess callback is provided, use it for custom redirect logic
      if (onSuccess) {
        await onSuccess()
      } else {
        toast.success("Signed in successfully!")
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      // Check if it's a WebAuthn abort error (user cancelled)
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.message.includes("abort")) {
          // User cancelled - don't show error
          return
        }
        toast.error(err.message || "Failed to sign in with passkey")
      } else {
        toast.error("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isLoading}
      onClick={handlePasskeySignIn}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <Fingerprint className="mr-2 h-4 w-4" />
          Sign in with Passkey
        </>
      )}
    </Button>
  )
}

/**
 * Passkey Sign-In Section
 *
 * A complete section with the passkey button and divider.
 * Use this for a more prominent passkey sign-in option.
 */
export function PasskeySignInSection({
  callbackUrl = "/",
  disabled = false,
}: {
  callbackUrl?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      <PasskeySignInButton
        callbackUrl={callbackUrl}
        disabled={disabled}
        className="w-full"
        variant="outline"
      />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
    </div>
  )
}
