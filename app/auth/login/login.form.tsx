"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Mail } from "lucide-react"
import { toast } from "sonner"

import {
  AuthContainer,
  AuthContainerContent,
  AuthContainerFooter,
  AuthContainerSecondaryContent,
} from "@/app/auth/_components/auth-container"
import { PasskeySignInButton } from "@/app/auth/_components/passkey-signin-button"
import { SocialLoginButtons } from "@/app/auth/_components/social-login-buttons"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { handlePostLoginRedirect } from "@/lib/actions/admin-auth"
import { authClient } from "@/lib/auth-client"

import AuthDivider from "../_components/auth-devider"
import { loginDefaultData, LoginFormData, loginSchema } from "./login.zod"

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultData,
  })

  const performPostLoginRedirect = async () => {
    const result = await handlePostLoginRedirect(callbackUrl)
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
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })
      if (result.error) {
        toast.error(result.error.message || "Failed to sign in")
        return
      }

      if (
        (result.data as { twoFactorRedirect?: boolean } | null)
          ?.twoFactorRedirect
      )
        return

      toast.success("Signed in successfully")
      await performPostLoginRedirect()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasskeySuccess = async () => {
    toast.success("Signed in successfully")
    await performPostLoginRedirect()
  }

  return (
    <AuthContainer
      title="Sign in to shop devices and accessories"
      description="Access your cart, orders, saved items, and account details for phones, accessories, and other electronics."
    >
      <AuthContainerContent>
        <div className="space-y-6">
          <PasskeySignInButton
            callbackUrl={callbackUrl}
            disabled={isLoading}
            className="border-input bg-background/80 text-foreground hover:bg-secondary h-12 w-full justify-center shadow-none"
            onSuccess={handlePasskeySuccess}
          />

          <AuthDivider text="Or use another method" />

          <SocialLoginButtons mode="signin" disabled={isLoading} />

          <p className="text-muted-foreground text-sm leading-6">
            Sign in once to track orders, save favorites, and move through
            checkout faster.
          </p>
        </div>
      </AuthContainerContent>

      <AuthContainerFooter>
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
          >
            Create one here
          </Link>
          .
        </p>
      </AuthContainerFooter>

      <AuthContainerSecondaryContent
        title="Other sign-in options"
        description="Use a passkey or provider sign-in to get back to checkout faster."
      >
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-5">
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2.5">
                  <FieldLabel
                    htmlFor="login-email"
                    className="text-foreground text-sm font-medium"
                  >
                    Email address
                  </FieldLabel>
                  <InputGroup className="border-input bg-background/80 h-12 shadow-none">
                    <InputGroupInput
                      {...field}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      disabled={isLoading}
                      placeholder="name@example.com"
                      className="h-12 px-4 text-base"
                    />
                    <InputGroupAddon
                      align="inline-end"
                      className="text-muted-foreground pr-4"
                    >
                      <Mail className="size-4" />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2.5">
                  <FieldLabel
                    htmlFor="login-password"
                    className="text-foreground text-sm font-medium"
                  >
                    Password
                  </FieldLabel>
                  <InputGroup className="border-input bg-background/80 h-12 shadow-none">
                    <InputGroupInput
                      {...field}
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      disabled={isLoading}
                      placeholder="Enter your password"
                      className="h-12 px-4 text-base"
                    />
                    <InputGroupAddon
                      align="inline-end"
                      className="text-muted-foreground pr-4"
                    >
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full text-base"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </AuthContainerSecondaryContent>
    </AuthContainer>
  )
}

export default LoginForm
