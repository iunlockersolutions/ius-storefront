"use client"

import { useState } from "react"

export function useMediaUploadQueue<T>(
  uploadFile: (
    file: File,
    onProgress: (percentage: number) => void,
  ) => Promise<T>,
) {
  const [isUploading, setIsUploading] = useState(false)
  const [progressByFile, setProgressByFile] = useState<Record<string, number>>(
    {},
  )

  async function uploadFiles(files: File[]) {
    setIsUploading(true)

    try {
      const results: T[] = []

      for (const file of files) {
        const result = await uploadFile(file, (percentage) => {
          setProgressByFile((current) => ({
            ...current,
            [file.name]: percentage,
          }))
        })
        results.push(result)
      }

      return results
    } finally {
      setIsUploading(false)
    }
  }

  function clearProgress(fileName?: string) {
    setProgressByFile((current) => {
      if (!fileName) {
        return {}
      }

      const next = { ...current }
      delete next[fileName]
      return next
    })
  }

  return {
    isUploading,
    progressByFile,
    uploadFiles,
    clearProgress,
  }
}
