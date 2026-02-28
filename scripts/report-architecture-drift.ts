import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const LARGE_CLIENT_LINE_THRESHOLD = 200

const ALLOWLIST = new Set([
  "components/admin/users/create-staff-form.tsx",
  "components/admin/users/staff-user-detail.tsx",
  "components/admin/users/user-sessions-table.tsx",
  "components/admin/auth/admin-login-form.tsx",
])

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

function findRoutePageDbImports() {
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

  return violations
}

function findLargeAdminClientActionImports() {
  const adminComponentsDir = path.join(process.cwd(), "components", "admin")
  const componentFiles = walk(adminComponentsDir).filter((filePath) =>
    filePath.endsWith(".tsx"),
  )

  const allowlisted: string[] = []
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
      allowlisted.push(relativePath)
    } else {
      violations.push(relativePath)
    }
  }

  return {
    allowlisted,
    violations,
  }
}

function scanAdminApiCoverage() {
  const adminApiDir = path.join(process.cwd(), "app", "api", "admin")
  const routeFiles = walk(adminApiDir).filter((filePath) =>
    filePath.endsWith("/route.ts"),
  )

  const missingPermissionGuard: string[] = []
  const missingMutationAudit: string[] = []

  for (const filePath of routeFiles) {
    const source = readFileSync(filePath, "utf8")
    const relativePath = toPosix(path.relative(process.cwd(), filePath))

    if (!source.includes("requireAdminApiPermission")) {
      missingPermissionGuard.push(relativePath)
    }

    const hasMutationHandler =
      /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/.test(source)
    if (hasMutationHandler && !source.includes("auditAdminMutation")) {
      missingMutationAudit.push(relativePath)
    }
  }

  return {
    totalRouteFiles: routeFiles.length,
    missingPermissionGuard,
    missingMutationAudit,
  }
}

function formatList(items: string[]) {
  if (items.length === 0) {
    return "- none"
  }

  return items.map((item) => `- ${item}`).join("\n")
}

function buildReport() {
  const generatedAt = new Date().toISOString()
  const routeDbViolations = findRoutePageDbImports()
  const clientActionImport = findLargeAdminClientActionImports()
  const apiCoverage = scanAdminApiCoverage()

  const criticalViolations =
    routeDbViolations.length +
    clientActionImport.violations.length +
    apiCoverage.missingPermissionGuard.length +
    apiCoverage.missingMutationAudit.length

  const markdown = `# Architecture Drift Report

Generated at: ${generatedAt}

## Summary

- Critical violations: ${criticalViolations}
- Route page direct DB imports: ${routeDbViolations.length}
- Large admin client direct server-action imports (new): ${clientActionImport.violations.length}
- Large admin client direct server-action imports (allowlisted baseline): ${clientActionImport.allowlisted.length}
- Admin API routes scanned: ${apiCoverage.totalRouteFiles}
- Admin API routes missing permission guard: ${apiCoverage.missingPermissionGuard.length}
- Admin API mutation routes missing audit logging: ${apiCoverage.missingMutationAudit.length}

## Route Page DB Import Violations

${formatList(routeDbViolations)}

## Large Admin Client Server-Action Imports (New Violations)

${formatList(clientActionImport.violations)}

## Large Admin Client Server-Action Imports (Allowlisted Baseline)

${formatList(clientActionImport.allowlisted)}

## Admin API Routes Missing Permission Guard

${formatList(apiCoverage.missingPermissionGuard)}

## Admin API Mutation Routes Missing Audit Logging

${formatList(apiCoverage.missingMutationAudit)}
`

  return {
    markdown,
    criticalViolations,
  }
}

function run() {
  const args = new Set(process.argv.slice(2))
  const checkMode = args.has("--check")

  const { markdown, criticalViolations } = buildReport()
  const reportPath = path.join(
    process.cwd(),
    "docs",
    "architecture",
    "drift-report.md",
  )

  if (!checkMode) {
    mkdirSync(path.dirname(reportPath), { recursive: true })
    writeFileSync(reportPath, markdown)
    console.log(
      `📝 Wrote drift report: ${toPosix(path.relative(process.cwd(), reportPath))}`,
    )
  }

  console.log(markdown)

  if (criticalViolations > 0) {
    console.error(
      `❌ Architecture drift detected: ${criticalViolations} critical violation(s)`,
    )
    process.exit(1)
  }

  console.log("✅ No critical architecture drift detected")
}

run()
