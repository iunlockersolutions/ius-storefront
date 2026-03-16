"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Heart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { toggleFavorite } from "@/lib/actions/favorites"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  productId: string
  initialIsFavorited?: boolean
  variant?: "icon" | "button"
  size?: "sm" | "default" | "lg"
  className?: string
}

export function FavoriteButton({
  productId,
  initialIsFavorited = false,
  variant = "icon",
  size = "default",
  className,
}: FavoriteButtonProps) {
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleFavorite(productId)

      if (result.success) {
        setIsFavorited(result.isFavorited!)
        toast.success(
          result.isFavorited ? "Added to favorites" : "Removed from favorites",
        )
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update favorites")
        if (result.error?.includes("sign in")) {
          router.push(
            "/auth/login?callbackUrl=" +
              encodeURIComponent(window.location.pathname),
          )
        }
      }
    })
  }

  if (variant === "button") {
    return (
      <Button
        variant={isFavorited ? "secondary" : "outline"}
        size={size}
        onClick={handleToggle}
        disabled={isPending}
        className={className}
      >
        <Heart
          className={cn(
            "mr-2 h-4 w-4",
            isFavorited && "fill-red-500 text-red-500",
          )}
        />
        {isFavorited ? "Saved" : "Save"}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "rounded-full transition-colors",
        isFavorited && "text-red-500 hover:text-red-600",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all",
          isFavorited && "fill-current scale-110",
        )}
      />
      <span className="sr-only">
        {isFavorited ? "Remove from favorites" : "Add to favorites"}
      </span>
    </Button>
  )
}
