"use client"

import { Suspense, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Lock, Mail, User2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { AuthPageSkeleton, AuthShell } from "@/app/auth/_components/auth-shell"
import {
  AuthDivider,
  SocialLoginButtons,
} from "@/app/auth/_components/social-login-buttons"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { authClient } from "@/lib/auth-client"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Register Page
 *
 * New account registration.
 */
function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
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
    <AuthShell
      eyebrow="New customer"
      title="Create your IUS Shop account"
      description="Save carts, track orders, and check out faster for phones, accessories, and everyday electronics."
      secondaryTitle="Quick sign up"
      secondaryDescription="Use a provider account if you want to start shopping right away."
      secondaryContent={
        <div className="space-y-6">
          <SocialLoginButtons mode="signup" disabled={isLoading} />

          <AuthDivider text="Why create an account" />

          <p className="text-muted-foreground text-sm leading-6">
            Keep your delivery details, saved products, and order updates ready
            for your next purchase.
          </p>
        </div>
      }
      footer={
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
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <InputGroup className="border-input bg-background/80 h-12 rounded-2xl shadow-none">
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
                <InputGroup className="border-input bg-background/80 h-12 rounded-2xl shadow-none">
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
                <InputGroup className="border-input bg-background/80 h-12 rounded-2xl shadow-none">
                  <InputGroupInput
                    {...field}
                    id="register-password"
                    type="password"
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
                    <Lock className="size-4" />
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
                <InputGroup className="border-input bg-background/80 h-12 rounded-2xl shadow-none">
                  <InputGroupInput
                    {...field}
                    id="register-confirm-password"
                    type="password"
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
                    <Lock className="size-4" />
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
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-2xl text-base"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}
