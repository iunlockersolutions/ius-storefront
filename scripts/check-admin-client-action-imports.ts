import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

const LARGE_CLIENT_LINE_THRESHOLD = 200

const ALLOWLIST = new Set<string>()

function walk(dirPath: string): string[] {
  const entries = readdirSync(dirPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }
    files.push(fullPath)
  }

  return files
}

function toPosix(relativePath: string) {
  return relativePath.split(path.sep).join("/")
}

function run() {
  const adminComponentsDir = path.join(process.cwd(), "components", "admin")
  const componentFiles = walk(adminComponentsDir).filter((filePath) =>
    filePath.endsWith(".tsx"),
  )

  const baselineMatches: string[] = []
  const violations: string[] = []

  for (const filePath of componentFiles) {
    const source = readFileSync(filePath, "utf8")
    const lineCount = source.split("\n").length

    if (lineCount < LARGE_CLIENT_LINE_THRESHOLD) {
      continue
    }

    if (!source.includes('"use client"') && !source.includes("'use client'")) {
      continue
    }

    const importsServerActions =
      /from\s+["']@\/lib\/actions(?:\/[^"']*)?["']/.test(source)

    if (!importsServerActions) {
      continue
    }

    const relativePath = toPosix(path.relative(process.cwd(), filePath))
    if (ALLOWLIST.has(relativePath)) {
      baselineMatches.push(relativePath)
      continue
    }

    violations.push(relativePath)
  }

  if (baselineMatches.length > 0) {
    console.log(
      "ℹ️ Existing allowlisted large admin client server-action imports:",
    )
    for (const baselineMatch of baselineMatches) {
      console.log(`- ${baselineMatch}`)
    }
  }

  if (violations.length === 0) {
    console.log("✅ Large admin client action import check passed")
    return
  }

  console.error("❌ Large admin client action import check failed")
  console.error(
    "Direct '@/lib/actions/*' imports were found in large admin client components:",
  )
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

run()
