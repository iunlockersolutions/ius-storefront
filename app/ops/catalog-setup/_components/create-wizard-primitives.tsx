"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CreateWizardStep {
  key: string
  label: string
  description: string
}

export function CreateWizardStepIndicator({
  steps,
  currentStep,
}: {
  steps: CreateWizardStep[]
  currentStep: number
}) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isComplete = index < currentStep

        return (
          <div
            key={step.key}
            className={cn(
              "rounded-2xl border px-3 py-3 transition-colors",
              isActive && "border-foreground/20 bg-foreground/4",
              isComplete && "border-emerald-200 bg-emerald-50",
              !isActive && !isComplete && "border-border/70 bg-muted/30",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isActive && "border-foreground/20 bg-background",
                  isComplete &&
                    "border-emerald-200 bg-emerald-100 text-emerald-700",
                  !isActive &&
                    !isComplete &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-4" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{step.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Step {index + 1}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CreateWizardSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function parseIntegerInput(value: string) {
  if (value === "") {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
