"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Eye, Search } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminContactMessage } from "@/lib/types/admin-contact-message"
import { formatDate } from "@/lib/utils"

interface ContactMessagesTableProps {
  messages: AdminContactMessage[]
  total: number
  page: number
  totalPages: number
  search: string
  status: string
  isLoading?: boolean
  errorMessage?: string | null
}

const statusColors: Record<string, string> = {
  unread: "bg-blue-100 text-blue-800",
  open: "bg-purple-100 text-purple-800",
  replied: "bg-green-100 text-green-800",
  closed: "bg-neutral-100 text-neutral-700",
  spam: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  unread: "Unread",
  open: "Open",
  replied: "Replied",
  closed: "Closed",
  spam: "Spam",
}

function snippet(message: string, max = 80) {
  const collapsed = message.replace(/\s+/g, " ").trim()
  if (collapsed.length <= max) return collapsed
  return `${collapsed.slice(0, max - 1).trimEnd()}…`
}

function initialsOf(name: string | null, email: string) {
  const source = name?.trim() || email
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function ContactMessagesTable({
  messages,
  total,
  page,
  totalPages,
  search,
  status,
  isLoading = false,
  errorMessage = null,
}: ContactMessagesTableProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)

  const pushParams = (next: {
    search?: string
    status?: string
    page?: number
  }) => {
    const params = new URLSearchParams()
    const nextSearch = next.search ?? search
    const nextStatus = next.status ?? status
    const nextPage = next.page ?? 1
    if (nextSearch) params.set("search", nextSearch)
    if (nextStatus) params.set("status", nextStatus)
    params.set("page", String(nextPage))
    router.push(`/ops/contact-messages?${params.toString()}`)
  }

  const handleSearch = () => pushParams({ search: searchInput, page: 1 })
  const handleStatusFilter = (value: string) =>
    pushParams({ status: value === "all" ? "" : value, page: 1 })
  const handlePageChange = (newPage: number) => pushParams({ page: newPage })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by name, email, or message..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={status || "all"} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="w-17.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading messages...
                </TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => {
                const isUnread = message.status === "unread"
                return (
                  <TableRow
                    key={message.id}
                    className={isUnread ? "font-medium" : undefined}
                  >
                    <TableCell>
                      <Badge className={statusColors[message.status]}>
                        {statusLabels[message.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{message.senderName}</div>
                      <div className="text-sm text-muted-foreground">
                        {message.senderEmail}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md text-sm text-foreground/80">
                      {snippet(message.message)}
                    </TableCell>
                    <TableCell>
                      {message.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {initialsOf(
                                message.assignee.name,
                                message.assignee.email,
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {message.assignee.name || message.assignee.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-10"
                      >
                        <Link href={`/ops/contact-messages/${message.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="ml-1">View</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {messages.length} of {total} messages
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
