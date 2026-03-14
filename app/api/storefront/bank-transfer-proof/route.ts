import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { put } from "@vercel/blob"
import crypto from "crypto"
import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  bankTransferProofs,
  guestOrderAccessTokens,
  orders,
  payments,
} from "@/lib/db/schema"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const paymentId = formData.get("paymentId")
    const orderId = formData.get("orderId")
    const notes = formData.get("notes")
    const accessToken = formData.get("accessToken")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (typeof paymentId !== "string" || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Payment and order are required" },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Upload a JPEG, PNG, WebP, GIF, or PDF file" },
        { status: 400 },
      )
    }

    const payment = await db.query.payments.findFirst({
      where: and(
        eq(payments.id, paymentId),
        eq(payments.orderId, orderId),
        eq(payments.method, "bank_transfer"),
      ),
    })

    if (!payment || payment.status !== "pending") {
      return NextResponse.json(
        { error: "This bank transfer is no longer accepting proofs" },
        { status: 400 },
      )
    }

    if (typeof accessToken === "string" && accessToken.length > 0) {
      const tokenRecord = await db.query.guestOrderAccessTokens.findFirst({
        where: eq(guestOrderAccessTokens.tokenHash, hashToken(accessToken)),
      })

      if (
        !tokenRecord ||
        tokenRecord.orderId !== orderId ||
        tokenRecord.expiresAt <= new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid access link" },
          { status: 403 },
        )
      }
    } else {
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
      })

      if (!order) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
    const blob = await put(
      `bank-transfer-proofs/${paymentId}-${nanoid(10)}.${ext}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      },
    )

    await db.insert(bankTransferProofs).values({
      paymentId,
      fileUrl: blob.url,
      fileName: file.name,
      fileSize: String(file.size),
      mimeType: file.type,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("Failed to upload storefront bank transfer proof:", error)
    return NextResponse.json(
      { error: "Failed to upload proof of payment" },
      { status: 500 },
    )
  }
}
