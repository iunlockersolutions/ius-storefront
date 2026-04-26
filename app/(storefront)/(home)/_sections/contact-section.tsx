"use client"

import { useState } from "react"

import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: integrate with contact form API
    setSubmitted(true)
  }

  return (
    <section className="section-container">
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="name"
                  placeholder="Name"
                  required
                  className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
                />
              </div>
              <Input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base placeholder:text-zinc-400"
              />
              <textarea
                name="message"
                placeholder="Message"
                required
                rows={5}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-xl bg-zinc-900 font-medium text-white hover:bg-zinc-800 sm:w-auto sm:px-8"
              >
                Send message
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
