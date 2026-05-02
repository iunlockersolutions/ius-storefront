import { ContactMessageDetailPageClient } from "../_components/contact-message-detail-page-client"

export const metadata = {
  title: "Contact Message | Operations",
}

interface ContactMessagePageProps {
  params: Promise<{ id: string }>
}

export default async function ContactMessagePage({
  params,
}: ContactMessagePageProps) {
  const { id } = await params
  return <ContactMessageDetailPageClient id={id} />
}
