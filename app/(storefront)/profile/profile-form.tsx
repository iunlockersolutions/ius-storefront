"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from "@/lib/actions/profile"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  preferredLanguage: z.string().default("en"),
  marketingOptIn: z.boolean().default(false),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: {
    id: string
    name: string | null
    email: string
    profile: {
      phone: string | null
      dateOfBirth: Date | null
      preferredLanguage: string | null
      marketingOptIn: boolean
    } | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.profile?.phone || "",
      dateOfBirth: user.profile?.dateOfBirth
        ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
        : "",
      preferredLanguage: user.profile?.preferredLanguage || "en",
      marketingOptIn: user.profile?.marketingOptIn ?? false,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await updateProfile(data)
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully" })
      } else {
        setMessage({ type: "error", text: "Failed to update profile" })
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredLanguage">Preferred Language</Label>
          <select
            id="preferredLanguage"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("preferredLanguage")}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  )
}
