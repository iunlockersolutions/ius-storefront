"use client"

import { useTransition } from "react"

import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface CopyTextButtonProps {
  value: string
  label?: string
}

export function CopyTextButton({
  value,
  label = "Copied to clipboard",
}: CopyTextButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() =>
        startTransition(async () => {
          await navigator.clipboard.writeText(value)
          toast.success(label)
        })
      }
    >
      {isPending ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span className="sr-only">Copy</span>
    </Button>
  )
}
