"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Mail, User2 } from "lucide-react"
import { toast } from "sonner"

import {
  AuthContainer,
  AuthContainerContent,
  AuthContainerFooter,
  AuthContainerSecondaryContent,
} from "@/app/auth/_components/auth-container"
import { SocialLoginButtons } from "@/app/auth/_components/social-login-buttons"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { SocialProviderId } from "@/lib/auth/social-provider-metadata"
import { authClient } from "@/lib/auth-client"

import AuthDivider from "../_components/auth-devider"
import {
  registerDefaultData,
  RegisterFormData,
  registerSchema,
} from "./register.zod"

interface RegisterFormProps {
  callbackUrl: string
  socialProviders: SocialProviderId[]
}

function RegisterForm({ callbackUrl, socialProviders }: RegisterFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const hasSocialProviders = socialProviders.length > 0

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaultData,
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to create account")
        return
      }

      toast.success("Account created successfully! Please sign in.")
      router.push("/auth/login")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContainer
      title="Create your EvoluX account"
      description="Save carts, track orders, and check out faster for phones, accessories, and everyday electronics."
    >
      <AuthContainerContent>
        <div className="space-y-6">
          {hasSocialProviders ? (
            <>
              <SocialLoginButtons
                callbackUrl={callbackUrl}
                providers={socialProviders}
                mode="signup"
                disabled={isLoading}
              />
              <AuthDivider text="Why create an account" />
            </>
          ) : null}

          <p className="text-muted-foreground text-sm leading-6">
            Keep your delivery details, saved products, and order updates ready
            for your next purchase.
          </p>
        </div>
      </AuthContainerContent>

      <AuthContainerFooter>
        <p>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
          >
            Sign in instead
          </Link>
          .
        </p>
      </AuthContainerFooter>

      <AuthContainerSecondaryContent
        title="Quick sign up"
        description="Use a provider account if you want to start shopping right away."
      >
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="gap-2.5 sm:col-span-2"
                >
                  <FieldLabel
                    htmlFor="register-name"
                    className="text-foreground text-sm font-medium"
                  >
                    Full name
                  </FieldLabel>
                  <InputGroup className="border-input bg-background/80 h-12 shadow-none">
                    <InputGroupInput
                      {...field}
                      id="register-name"
                      type="text"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      disabled={isLoading}
                      placeholder="John Doe"
                      className="h-12 px-4 text-base"
                    />
                    <InputGroupAddon
                      align="inline-end"
                      className="text-muted-foreground pr-4"
                    >
                      <User2 className="size-4" />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="gap-2.5 sm:col-span-2"
                >
                  <FieldLabel
                    htmlFor="register-email"
                    className="text-foreground text-sm font-medium"
                  >
                    Email address
                  </FieldLabel>
                  <InputGroup className="border-input bg-background/80 h-12 shadow-none">
                    <InputGroupInput
                      {...field}
                      id="register-email"
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
                    htmlFor="register-password"
                    className="text-foreground text-sm font-medium"
                  >
                    Password
                  </FieldLabel>
                  <InputGroup className="border-input bg-background/80 h-12 shadow-none">
                    <InputGroupInput
                      {...field}
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      disabled={isLoading}
                      placeholder="Create a password"
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

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2.5">
                  <FieldLabel
                    htmlFor="register-confirm-password"
                    className="text-foreground text-sm font-medium"
                  >
                    Confirm password
                  </FieldLabel>
                  <InputGroup className="border-input bg-background/80 h-12 shadow-none">
                    <InputGroupInput
                      {...field}
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      disabled={isLoading}
                      placeholder="Repeat your password"
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
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        aria-pressed={showConfirmPassword}
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                      >
                        {showConfirmPassword ? (
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
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </AuthContainerSecondaryContent>
    </AuthContainer>
  )
}

export default RegisterForm
