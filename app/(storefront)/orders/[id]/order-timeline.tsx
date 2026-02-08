"use client"

import { format } from "date-fns"
import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface TimelineEntry {
  status: string
  label: string
  date: Date
  description: string
}

interface OrderTimelineProps {
  timeline: TimelineEntry[]
  currentStatus: string
}

function getStatusIcon(status: string, isActive: boolean) {
  const iconClass = cn(
    "h-5 w-5",
    isActive ? "text-primary" : "text-muted-foreground",
  )

  switch (status) {
    case "created":
    case "draft":
      return <Clock className={iconClass} />
    case "pending_payment":
      return <Clock className={iconClass} />
    case "paid":
      return <CheckCircle2 className={iconClass} />
    case "processing":
    case "packing":
      return <Package className={iconClass} />
    case "shipped":
      return <Truck className={iconClass} />
    case "delivered":
      return <CheckCircle2 className={iconClass} />
    case "cancelled":
    case "refunded":
      return <XCircle className={iconClass} />
    default:
      return <Clock className={iconClass} />
  }
}

export function OrderTimeline({ timeline, currentStatus }: OrderTimelineProps) {
  const isCancelled =
    currentStatus === "cancelled" || currentStatus === "refunded"

  return (
    <div className="relative">
      {timeline.map((entry, index) => {
        const isLast = index === timeline.length - 1
        const isActive =
          entry.status === currentStatus || (isLast && !isCancelled)

        return (
          <div key={index} className="flex gap-4 pb-6 last:pb-0">
            {/* Line and Icon */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-background",
                )}
              >
                {getStatusIcon(entry.status, isActive)}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "absolute top-10 h-full w-0.5",
                    isActive ? "bg-primary/30" : "bg-muted",
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <h4
                  className={cn(
                    "font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {entry.label}
                </h4>
                <time className="text-xs text-muted-foreground">
                  {format(new Date(entry.date), "MMM d, h:mm a")}
                </time>
              </div>
              {entry.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {entry.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
