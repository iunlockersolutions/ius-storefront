import { InstallmentPlanForm } from "../_components/installment-plan-form"

export const metadata = {
  title: "New Installment Plan | Operations",
  description: "Create a 0% installment plan notice",
}

export default function NewInstallmentPlanPage() {
  return <InstallmentPlanForm mode="create" />
}
