import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

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
  const appDir = path.join(process.cwd(), "app")
  const pageFiles = walk(appDir).filter((filePath) =>
    filePath.endsWith("/page.tsx"),
  )

  const violations: string[] = []
  const dbImportPattern = /from\s+["']@\/lib\/db(?:\/[^"']*)?["']/g

  for (const filePath of pageFiles) {
    const source = readFileSync(filePath, "utf8")
    if (dbImportPattern.test(source)) {
      violations.push(toPosix(path.relative(process.cwd(), filePath)))
    }
  }

  if (violations.length === 0) {
    console.log("✅ Route page DB import check passed")
    return
  }

  console.error("❌ Route page DB import check failed")
  console.error("The following route page files import @/lib/db directly:")
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

run()
