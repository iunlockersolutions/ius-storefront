"use client"

import { type FormEvent, useEffect, useState } from "react"

import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth-client"

interface FieldErrors {
  name?: string
  email?: string
  phone?: string
  message?: string
}

interface ApiErrorPayload {
  success: false
  error: {
    code: string
    message: string
    details?: { fieldErrors?: FieldErrors }
  }
}

interface ContactFormProps {
  submitLabel?: string
  successTitle?: string
  successMessage?: string
  messagePlaceholder?: string
}

export function ContactForm({
  submitLabel = "Send message",
  successTitle = "Message sent",
  successMessage = "We'll get back to you as soon as possible.",
  messagePlaceholder = "Tell us how we can help",
}: ContactFormProps) {
  const session = authClient.useSession()
  const sessionUser = session.data?.user

  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (sessionUser?.name && !name) setName(sessionUser.name)
    if (sessionUser?.email && !email) setEmail(sessionUser.email)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.name, sessionUser?.email])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setFieldErrors({})
    setFormError(null)
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      hp: String(formData.get("hp") ?? ""),
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setSubmitted(true)
        return
      }

      if (response.status === 429) {
        setFormError("Too many submissions. Please try again in an hour.")
        return
      }

      const body = (await response
        .json()
        .catch(() => null)) as ApiErrorPayload | null

      if (body?.error?.details?.fieldErrors) {
        setFieldErrors(body.error.details.fieldErrors)
        return
      }

      setFormError(
        body?.error?.message ?? "Something went wrong. Please try again.",
      )
    } catch {
      setFormError("Could not reach the server. Please try again.")
    } finally {
      setPending(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 px-6 py-10 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-100">
          <Send className="size-5 text-emerald-700" />
        </div>
        <h3 className="text-base font-semibold text-zinc-950">
          {successTitle}
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
          {successMessage}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] size-px opacity-0"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Input
            name="name"
            placeholder="Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            className="h-12 rounded-lg border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
          />
          {fieldErrors.name ? (
            <p className="text-xs text-red-600">{fieldErrors.name}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            className="h-12 rounded-lg border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
          />
          {fieldErrors.email ? (
            <p className="text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Input
          name="phone"
          type="tel"
          placeholder="Phone number"
          aria-invalid={Boolean(fieldErrors.phone)}
          className="h-12 rounded-lg border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
        />
        {fieldErrors.phone ? (
          <p className="text-xs text-red-600">{fieldErrors.phone}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <Textarea
          name="message"
          placeholder={messagePlaceholder}
          required
          rows={6}
          aria-invalid={Boolean(fieldErrors.message)}
          className="min-h-36 rounded-lg border-zinc-200 bg-white px-4 py-3 text-base placeholder:text-zinc-400"
        />
        {fieldErrors.message ? (
          <p className="text-xs text-red-600">{fieldErrors.message}</p>
        ) : null}
      </div>

      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-12 rounded-lg bg-zinc-950 px-6 font-medium text-white hover:bg-zinc-800 sm:w-fit"
      >
        {pending ? "Sending..." : submitLabel}
      </Button>
    </form>
  )
}
