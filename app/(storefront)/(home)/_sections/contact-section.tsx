import Link from "next/link"

import { Mail } from "lucide-react"

import { ContactForm } from "../../_components/support/contact-form"
import { supportContact } from "../../_components/support/support-content"

export function ContactSection() {
  return (
    <section className="section-container" id="contact">
      <h2 className="mb-8 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
        Contact Us
      </h2>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Form */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 sm:p-6 lg:p-8">
          <Link
            href={`mailto:${supportContact.email}`}
            className="mb-5 flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-950"
          >
            <Mail className="size-4" />
            {supportContact.email}
          </Link>
          <ContactForm
            successTitle="Message Sent!"
            successMessage="We'll get back to you as soon as possible."
            messagePlaceholder="Message"
          />
        </div>

        {/* Map */}
        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100 lg:min-h-0">
          {/* Google Maps - Matara, Sri Lanka */}
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
