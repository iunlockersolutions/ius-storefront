"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  error?: string
  required?: boolean
  description?: string
  htmlFor?: string
}

/**
 * A simple form field wrapper with label and error display.
 * Use this for quick form layouts. For complex layouts, use Field, FieldLabel, etc.
 */
export function FormField({
  label,
  error,
  required,
  description,
  htmlFor,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
