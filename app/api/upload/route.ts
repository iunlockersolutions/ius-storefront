import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { del, put } from "@vercel/blob"
import { nanoid } from "nanoid"

import { auth } from "@/lib/auth"
import { hasAnyRole } from "@/lib/auth/rbac"

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed image types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or manager
    const canUpload = await hasAnyRole(session.user.id, ["admin", "manager"])
    if (!canUpload) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "products"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 },
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, AVIF" },
        { status: 400 },
      )
    }

    // Generate unique filename with original extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `${folder}/${nanoid()}.${ext}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    )
  }
}

// Delete an image
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or manager
    const canDelete = await hasAnyRole(session.user.id, ["admin", "manager"])
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      )
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    )
  }
}
