import { HelpCircle } from "lucide-react"

import { ContactForm } from "./contact-form"
import { ContactMethods } from "./contact-methods"
import { SupportHero } from "./support-hero"

interface ContactPageProps {
  kind: "contact" | "expert"
}

const pageCopy = {
  contact: {
    eyebrow: "Contact EvoluX",
    title: "Tell us what you need. We will help you get it sorted.",
    description:
      "For order questions, product support, delivery updates, or general inquiries, send us a message and our team will get back to you as soon as possible.",
    formTitle: "Send us a message",
    formDescription:
      "Share the product, order number, or question if you have it. A little detail helps us reply with the right answer.",
    submitLabel: "Send message",
    placeholder: "How can we help?",
  },
  expert: {
    eyebrow: "Ask an Expert",
    title: "Get friendly advice before you choose your next device.",
    description:
      "Not sure which phone, laptop, accessory, or gift is right? Tell us what you need and our team will help you compare options clearly.",
    formTitle: "Ask your question",
    formDescription:
      "Tell us your budget, preferred brands, current device, or how you plan to use the product. We will point you in the right direction.",
    submitLabel: "Ask an expert",
    placeholder:
      "Tell us what you are looking for, your budget, and any products you are comparing.",
  },
}

export function ContactPage({ kind }: ContactPageProps) {
  const copy = pageCopy[kind]

  return (
    <>
      <SupportHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        icon={HelpCircle}
      />

      <section className="section-container">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr]">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                {copy.formTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {copy.formDescription}
              </p>
            </div>
            <ContactForm
              submitLabel={copy.submitLabel}
              messagePlaceholder={copy.placeholder}
              successTitle="Thanks, we received your message"
              successMessage="Our team will review it and reply through the best available contact method."
            />
          </div>

          <aside className="border-t border-zinc-200/70 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              Other ways to reach us
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Use these example contact details for now. They are ready to be
              replaced with the official store details later.
            </p>
            <div className="mt-6">
              <ContactMethods />
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
