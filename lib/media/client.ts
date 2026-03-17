"use client"

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Failed to load image"))
    }
    image.src = objectUrl
  })
}

function fileFromDataUrl(dataUrl: string, filename: string, mimeType: string) {
  const [header, body] = dataUrl.split(",")
  if (!header || !body) {
    throw new Error("Invalid data URL")
  }

  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], filename, { type: mimeType })
}

export async function generateImagePreviewData(file: File) {
  const image = await loadImageFromFile(file)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Canvas is not supported in this browser")
  }

  const maxPreviewSize = 24
  const scale = Math.min(
    maxPreviewSize / image.width,
    maxPreviewSize / image.height,
    1,
  )
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const placeholderDataUrl = canvas.toDataURL("image/webp", 0.65)
  const blurFile = fileFromDataUrl(
    placeholderDataUrl,
    `${file.name.replace(/\.[^.]+$/, "")}.blur.webp`,
    "image/webp",
  )

  return {
    width: image.width,
    height: image.height,
    placeholderDataUrl,
    blurFile,
  }
}

export async function generateVideoPreviewData(file: File) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.src = objectUrl
    video.muted = true
    video.playsInline = true

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve()
      video.onerror = () => reject(new Error("Failed to load video"))
    })

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Canvas is not supported in this browser")
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const posterDataUrl = canvas.toDataURL("image/jpeg", 0.82)
    const posterFile = fileFromDataUrl(
      posterDataUrl,
      `${file.name.replace(/\.[^.]+$/, "")}.poster.jpg`,
      "image/jpeg",
    )

    return {
      width: video.videoWidth || null,
      height: video.videoHeight || null,
      durationSeconds: Math.max(0, Math.round(video.duration || 0)),
      posterFile,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
