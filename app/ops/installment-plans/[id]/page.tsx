import { InstallmentPlanForm } from "../_components/installment-plan-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Installment Plan | Operations",
  description: "Edit a 0% installment plan notice",
}

export default async function EditInstallmentPlanPage({ params }: PageProps) {
  const { id } = await params

  return <InstallmentPlanForm mode="edit" offerId={id} />
}
