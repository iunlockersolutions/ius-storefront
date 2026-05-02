"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { AdminNotification } from "@/lib/types/admin-contact-message"
import { formatDate } from "@/lib/utils"
import { useMarkNotificationsReadMutation } from "@/services/mutations/use-notification-mutations"
import { useAdminNotificationsQuery } from "@/services/queries/use-admin-notifications-query"

function targetHref(notification: AdminNotification): string | null {
  if (notification.targetRef.startsWith("contact_message:")) {
    const id = notification.targetRef.slice("contact_message:".length)
    if (id) return `/ops/contact-messages/${id}`
  }
  return null
}

export function OpsNotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const feed = useAdminNotificationsQuery()
  const markRead = useMarkNotificationsReadMutation()

  const unreadCount = feed.data?.unreadCount ?? 0
  const items = feed.data?.items ?? []

  const handleItemClick = (notification: AdminNotification) => {
    const href = targetHref(notification)
    if (!notification.readAt) {
      markRead.mutate([notification.id])
    }
    setOpen(false)
    if (href) router.push(href)
  }

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return
    markRead.mutate(undefined)
  }

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-border/70 bg-background/70"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-semibold leading-none text-white">
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up."}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markRead.isPending}
            >
              Mark all read
            </Button>
          </div>
        </SheetHeader>

        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto">
          {feed.isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : feed.error instanceof Error ? (
            <div className="px-5 py-4 text-sm text-destructive">
              {feed.error.message}
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((notification) => {
                const isUnread = !notification.readAt
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(notification)}
                      className={`flex w-full flex-col gap-1 px-5 py-4 text-left transition hover:bg-muted/60 ${isUnread ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-sm ${isUnread ? "font-semibold text-foreground" : "text-foreground/80"}`}
                        >
                          {notification.title}
                        </span>
                        {isUnread ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.preview}
                      </p>
                      <span className="text-[0.7rem] text-muted-foreground/70">
                        {formatDate(notification.createdAt)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
