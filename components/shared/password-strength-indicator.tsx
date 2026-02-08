"use client"

import { useMemo } from "react"

import { Check, X } from "lucide-react"

import {
  calculatePasswordStrength,
  getStrengthLabel,
  hasLowercase,
  hasMinLength,
  hasNumber,
  hasSpecialChar,
  hasUppercase,
  passwordRequirements,
} from "@/lib/utils/password-requirements"

interface PasswordStrengthIndicatorProps {
  password: string
  showRequirements?: boolean
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  )
  const { label, color } = getStrengthLabel(strength)

  const requirements = useMemo(
    () => [
      {
        met: hasMinLength(password),
        label: `At least ${passwordRequirements.minLength} characters`,
      },
      {
        met: hasUppercase(password),
        label: "One uppercase letter (A-Z)",
      },
      {
        met: hasLowercase(password),
        label: "One lowercase letter (a-z)",
      },
      {
        met: hasNumber(password),
        label: "One number (0-9)",
      },
      {
        met: hasSpecialChar(password),
        label: "One special character (!@#$%...)",
      },
    ],
    [password],
  )

  if (!password) return null

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span className="font-medium">{label}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${color}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1.5">
          {requirements.map((req) => (
            <div
              key={req.label}
              className={`flex items-center gap-2 text-sm transition-colors ${
                req.met ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {req.met ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
