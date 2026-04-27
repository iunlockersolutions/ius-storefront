"use client"

import { useEffect, useState } from "react"

import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function ContactSection() {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return
    setFieldErrors({})
    setFormError(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
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
        setFormError(null)
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

  return (
    <section className="section-container" id="contact">
      <h2 className="mb-8 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
        Contact Us
      </h2>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Form */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 sm:p-6 lg:p-8">
          {submitted ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Send className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Message Sent!
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                We&apos;ll get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              noValidate
            >
              {/* Honeypot — visually hidden but in the DOM */}
              <input
                type="text"
                name="hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                }}
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
                    className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
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
                    className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
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
                  placeholder="Phone Number"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
                />
                {fieldErrors.phone ? (
                  <p className="text-xs text-red-600">{fieldErrors.phone}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <textarea
                  name="message"
                  placeholder="Message"
                  required
                  rows={5}
                  aria-invalid={Boolean(fieldErrors.message)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
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
                className="h-12 w-full rounded-xl bg-zinc-900 font-medium text-white hover:bg-zinc-800 sm:w-auto sm:px-8"
              >
                {pending ? "Sending..." : "Send message"}
              </Button>
            </form>
          )}
        </div>

        {/* Map */}
        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100 lg:min-h-0">
          {/* Google Maps — Matara, Sri Lanka */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63546.07637952064!2d80.50954895!3d5.9485202!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae138d151937cd9%3A0x1d711f45897e4c83!2sMatara%2C%20Sri%20Lanka!5e0!3m2!1sen!2sus!4v1"
            className="h-full w-full border-0"
            style={{ minHeight: "18rem" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            title="Store location — Matara, Sri Lanka"
          />
        </div>
      </div>
    </section>
  )
}
