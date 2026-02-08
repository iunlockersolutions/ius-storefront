"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Fingerprint, Loader2, Shield } from "lucide-react"
import { z } from "zod"

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
  checkStaffLogin,
  setMustChangePasswordCookie,
} from "@/lib/actions/admin-auth"
import { authClient, signIn } from "@/lib/auth-client"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/admin"
  const [isLoading, setIsLoading] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setError(null)

    try {
      // First check if user is a staff member
      const staffCheck = await checkStaffLogin(data.email)

      if (!staffCheck.isStaff) {
        setError(
          "This login is for staff members only. Please use the regular login page.",
        )
        return
      }

      if (staffCheck.banned) {
        setError(
          staffCheck.banReason
            ? `Your account has been suspended: ${staffCheck.banReason}`
            : "Your account has been suspended. Please contact an administrator.",
        )
        return
      }

      // Attempt to sign in
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        setError(result.error.message || "Invalid credentials")
        return
      }

      // Set must-change-password cookie if needed
      if (staffCheck.mustChangePassword) {
        await setMustChangePasswordCookie(true)
        router.push("/admin/change-password")
      } else {
        router.push(callbackUrl)
      }

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasskeySignIn() {
    setIsPasskeyLoading(true)
    setError(null)

    try {
      const result = await authClient.signIn.passkey()

      if (result?.error) {
        if (result.error.message?.includes("cancelled")) {
          return
        }
        setError(result.error.message || "Failed to sign in with passkey")
        return
      }

      // After passkey sign-in, check if it's a staff member and mustChangePassword
      const session = await authClient.getSession()
      if (session?.data?.user?.email) {
        const staffCheck = await checkStaffLogin(session.data.user.email)

        if (!staffCheck.isStaff) {
          // Sign out and show error
          await authClient.signOut()
          setError("This login is for staff members only.")
          return
        }

        if (staffCheck.banned) {
          await authClient.signOut()
          setError(
            staffCheck.banReason
              ? `Your account has been suspended: ${staffCheck.banReason}`
              : "Your account has been suspended.",
          )
          return
        }

        if (staffCheck.mustChangePassword) {
          await setMustChangePasswordCookie(true)
          router.push("/admin/change-password")
        } else {
          router.push(callbackUrl)
        }

        router.refresh()
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.message.includes("abort")) {
          return
        }
        setError(err.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Staff Login</CardTitle>
        <CardDescription>Sign in to access the admin panel</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Passkey Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handlePasskeySignIn}
            disabled={isLoading || isPasskeyLoading}
          >
            {isPasskeyLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="mr-2 h-4 w-4" />
            )}
            Sign in with Passkey
          </Button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <FormField label="Email" error={form.formState.errors.email?.message}>
            <Input
              {...form.register("email")}
              type="email"
              placeholder="staff@example.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Password"
            error={form.formState.errors.password?.message}
          >
            <Input
              {...form.register("password")}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </FormField>

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Not a staff member?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Go to customer login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
