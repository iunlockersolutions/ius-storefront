import { NextRequest } from "next/server"

import { recordContactMessageReply } from "@/lib/actions/contact-message"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { sendEmail } from "@/lib/email/send"
import {
  fail,
  failFromMessage,
  mapErrorToApi,
  ok,
} from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("contact_message", "reply")

    const { id } = await params
    const body = (await request.json().catch(() => null)) as {
      body?: string
    } | null

    if (
      !body ||
      typeof body.body !== "string" ||
      body.body.trim().length === 0
    ) {
      return fail("BAD_REQUEST", "Reply body is required", 400)
    }

    const result = await recordContactMessageReply({
      id,
      body: body.body,
    })

    if (!result.success || !result.data) {
      return failFromMessage(
        result.error || "Failed to record reply",
        "BAD_REQUEST",
      )
    }

    // Email send happens outside the DB transaction; failure to send doesn't
    // roll back the recorded reply (the staff user still wrote the message).
    const emailResult = await sendEmail({
      to: result.data.senderEmail,
      subject: "Re: your message to EvoluX",
      template: "contact-reply",
      data: {
        customerName: result.data.senderName,
        replyBody: result.data.replyBody,
        originalMessage: result.data.originalMessage,
        staffName: result.data.staffName,
      },
    })

    await auditAdminMutation({
      action: "contact_message.reply",
      entityType: "contact_message",
      entityId: id,
      details: {
        recipient: result.data.senderEmail,
        emailSent: emailResult.success,
      },
    })

    return ok({
      id: result.data.id,
      emailSent: emailResult.success,
      emailError: emailResult.success ? undefined : emailResult.error,
    })
  } catch (error) {
    return mapErrorToApi(error)
  }
}
