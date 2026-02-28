import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

type Violation = {
  file: string
  table: string
  message: string
}

function getSchemaFiles(schemaDir: string) {
  return readdirSync(schemaDir)
    .filter((fileName) => fileName.endsWith(".ts") && fileName !== "index.ts")
    .map((fileName) => path.join(schemaDir, fileName))
}

function findTableDefinitions(source: string) {
  const tableRegex =
    /export\s+const\s+(\w+)\s*=\s*pgTable\(\s*["'][^"']+["']\s*,\s*\{([\s\S]*?)\}\s*,?/g
  const definitions: Array<{ tableName: string; body: string }> = []

  let match: RegExpExecArray | null
  while ((match = tableRegex.exec(source)) !== null) {
    definitions.push({
      tableName: match[1],
      body: match[2],
    })
  }

  return definitions
}

function findFieldInitializer(tableBody: string, fieldName: string) {
  const fieldRegex = new RegExp(
    `(?:^|\\n)\\s*${fieldName}:\\s*([\\s\\S]*?),(?=\\n\\s*\\w+\\s*:|\\n\\s*$)`,
    "m",
  )

  const match = tableBody.match(fieldRegex)
  return match?.[1]?.trim() ?? null
}

function findReferenceFields(tableBody: string) {
  const fieldRegex = /(?:^|\n)\s*(\w+):\s*([\s\S]*?),(?=\n\s*\w+\s*:|\n\s*$)/gm

  const fields: Array<{ fieldName: string; initializer: string }> = []
  let match: RegExpExecArray | null

  while ((match = fieldRegex.exec(tableBody)) !== null) {
    if (match[2].includes(".references(")) {
      fields.push({
        fieldName: match[1],
        initializer: match[2].trim(),
      })
    }
  }

  return fields
}

function runAudit() {
  const schemaDir = path.join(process.cwd(), "lib/db/schema")
  const violations: Violation[] = []

  for (const filePath of getSchemaFiles(schemaDir)) {
    const source = readFileSync(filePath, "utf8")
    const relativeFilePath = path.relative(process.cwd(), filePath)

    for (const tableDefinition of findTableDefinitions(source)) {
      const idInitializer = findFieldInitializer(tableDefinition.body, "id")

      if (!idInitializer) {
        violations.push({
          file: relativeFilePath,
          table: tableDefinition.tableName,
          message: 'Missing required primary key field "id"',
        })
      } else {
        if (!idInitializer.includes('uuid("id")')) {
          violations.push({
            file: relativeFilePath,
            table: tableDefinition.tableName,
            message: 'Primary key "id" must use uuid("id")',
          })
        }

        if (!idInitializer.includes(".primaryKey(")) {
          violations.push({
            file: relativeFilePath,
            table: tableDefinition.tableName,
            message: 'Primary key "id" must call .primaryKey()',
          })
        }
      }

      for (const referenceField of findReferenceFields(tableDefinition.body)) {
        if (!referenceField.initializer.includes("uuid(")) {
          violations.push({
            file: relativeFilePath,
            table: tableDefinition.tableName,
            message: `Foreign key field "${referenceField.fieldName}" must be UUID-typed`,
          })
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log("✅ UUID schema audit passed")
    return
  }

  console.error("❌ UUID schema audit failed")
  for (const violation of violations) {
    console.error(
      `- ${violation.file} [${violation.table}] ${violation.message}`,
    )
  }
  process.exit(1)
}

runAudit()
