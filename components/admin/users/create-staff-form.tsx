"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail, Shield, UserPlus } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createStaffUser } from "@/lib/actions/admin-users"

const createStaffSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "support"], {
    required_error: "Please select a role",
  }),
})

type CreateStaffValues = z.infer<typeof createStaffSchema>

const roleDescriptions = {
  admin:
    "Full access to all features including user management and system settings",
  manager: "Can manage products, orders, inventory, and view reports",
  support: "Can view and respond to customer inquiries and manage orders",
}

export function CreateStaffForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: undefined,
    },
  })

  const selectedRole = form.watch("role")

  async function onSubmit(data: CreateStaffValues) {
    setLoading(true)
    setError(null)

    try {
      const result = await createStaffUser(data)

      if (!result.success) {
        setError(result.error || "Failed to create staff user")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/users")
      }, 2000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Invitation Sent!</h3>
            <p className="text-muted-foreground">
              An invitation email has been sent with login credentials.
              Redirecting to users list...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Invite Staff Member</CardTitle>
            <CardDescription>
              Send an invitation email with temporary login credentials
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <FormField
            label="Full Name"
            error={form.formState.errors.name?.message}
            required
          >
            <Input
              {...form.register("name")}
              placeholder="John Doe"
              autoComplete="off"
            />
          </FormField>

          <FormField
            label="Email Address"
            error={form.formState.errors.email?.message}
            required
          >
            <Input
              {...form.register("email")}
              type="email"
              placeholder="john@example.com"
              autoComplete="off"
            />
          </FormField>

          <FormField
            label="Role"
            error={form.formState.errors.role?.message}
            required
          >
            <Select
              value={form.watch("role")}
              onValueChange={(value) =>
                form.setValue("role", value as CreateStaffValues["role"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="support">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Support
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    Manager
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    Administrator
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {selectedRole && (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <strong className="capitalize">{selectedRole}:</strong>{" "}
              {roleDescriptions[selectedRole]}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
