import { ContactPage } from "../_components/support/contact-page"

export const metadata = {
  title: "Ask an Expert | EvoluX",
  description:
    "Get friendly product advice from EvoluX before choosing your next phone, laptop, accessory, or gift.",
}

export default function AskAnExpertPage() {
  return <ContactPage kind="expert" />
}
