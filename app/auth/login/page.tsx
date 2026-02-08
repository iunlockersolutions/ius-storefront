"use client"

import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"

import { PasskeySignInButton } from "@/components/auth/passkey-signin-button"
import {
  AuthDivider,
  SocialLoginButtons,
} from "@/components/auth/social-login-buttons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { handlePostLoginRedirect } from "@/lib/actions/admin-auth"
import { authClient, signIn } from "@/lib/auth-client"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Login Form Component
 *
 * Unified login for all users:
 * - Customers can use any login method
 * - Staff (admin, manager, support) use email/password or passkey
 * - After login, staff are redirected to /admin, customers to their destination
 */
function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const performPostLoginRedirect = async () => {
    // Use server action to handle redirect based on role
    const result = await handlePostLoginRedirect(callbackUrl)

    // If we get here, it means user is banned (redirect throws, so we only get result on error)
    if (result?.error === "banned") {
      await authClient.signOut()
      toast.error(
        result.banReason
          ? `Your account has been suspended: ${result.banReason}`
          : "Your account has been suspended. Please contact an administrator.",
      )
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to sign in")
        return
      }

      toast.success("Signed in successfully")
      await performPostLoginRedirect()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle post-passkey login redirect
  const handlePasskeySuccess = async () => {
    toast.success("Signed in successfully")
    await performPostLoginRedirect()
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Sign in to your account using email or social providers
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Passkey Sign-In */}
          <PasskeySignInButton
            callbackUrl={callbackUrl}
            disabled={isLoading}
            className="w-full"
            onSuccess={handlePasskeySuccess}
          />

          <AuthDivider text="Or continue with" />

          {/* Social Login Buttons */}
          <SocialLoginButtons mode="signin" disabled={isLoading} />

          <AuthDivider />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium underline hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

/**
 * Login Page
 *
 * Email/password authentication.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
