import { hashPassword } from "better-auth/crypto"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { account, user } from "./schema"

import "dotenv/config"

type CreateAdminOptions = {
  email: string
  name: string
  password: string
  mustChangePassword: boolean
}

function usage() {
  return `
Create or update an admin user.

Usage:
  pnpm db:create-admin -- --email admin@example.com --password 'StrongPass123!' --name 'System Admin'

Options:
  --email <email>                 Admin email address
  --password <password>           Admin password
  --name <name>                   Admin display name (default: System Admin)
  --must-change-password          Force password change after first login
  --no-must-change-password       Do not force password change (default)

Environment fallbacks:
  ADMIN_EMAIL
  ADMIN_PASSWORD
  ADMIN_NAME
  ADMIN_MUST_CHANGE_PASSWORD=true
`
}

function readFlagValue(args: string[], flag: string) {
  const equalsPrefix = `${flag}=`
  const equalsMatch = args.find((arg) => arg.startsWith(equalsPrefix))

  if (equalsMatch) {
    return equalsMatch.slice(equalsPrefix.length)
  }

  const flagIndex = args.indexOf(flag)
  if (flagIndex === -1) {
    return undefined
  }

  const value = args[flagIndex + 1]
  if (!value || value.startsWith("--")) {
    return undefined
  }

  return value
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback
  }

  return ["1", "true", "yes", "y"].includes(value.toLowerCase())
}

function parseOptions(): CreateAdminOptions {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage())
    process.exit(0)
  }

  const email = (
    readFlagValue(args, "--email") ?? process.env.ADMIN_EMAIL
  )?.trim()
  const password =
    readFlagValue(args, "--password") ?? process.env.ADMIN_PASSWORD
  const name =
    (readFlagValue(args, "--name") ?? process.env.ADMIN_NAME)?.trim() ||
    "System Admin"

  const mustChangePassword = args.includes("--must-change-password")
    ? true
    : args.includes("--no-must-change-password")
      ? false
      : parseBoolean(process.env.ADMIN_MUST_CHANGE_PASSWORD, false)

  if (!email || !password) {
    console.error("Missing required admin email or password.")
    console.error(usage())
    process.exit(1)
  }

  return {
    email: email.toLowerCase(),
    name,
    password,
    mustChangePassword,
  }
}

async function createAdminUser() {
  const options = parseOptions()
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  console.log("Creating admin user...")

  try {
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, options.email))
      .limit(1)

    const passwordHash = await hashPassword(options.password)

    if (existingUsers.length === 0) {
      const [adminUser] = await db
        .insert(user)
        .values({
          email: options.email,
          emailVerified: true,
          name: options.name,
          role: "admin",
          mustChangePassword: options.mustChangePassword,
          lastPasswordChange: options.mustChangePassword ? null : new Date(),
        })
        .returning()

      await db.insert(account).values({
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: passwordHash,
      })

      console.log(`Created admin user: ${options.email}`)
      return
    }

    const [adminUser] = existingUsers

    await db
      .update(user)
      .set({
        emailVerified: true,
        name: options.name,
        role: "admin",
        mustChangePassword: options.mustChangePassword,
        lastPasswordChange: options.mustChangePassword ? null : new Date(),
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, adminUser.id))

    const credentialAccounts = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, adminUser.id),
          eq(account.providerId, "credential"),
        ),
      )
      .limit(1)

    if (credentialAccounts.length === 0) {
      await db.insert(account).values({
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: passwordHash,
      })
    } else {
      await db
        .update(account)
        .set({
          password: passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(account.id, credentialAccounts[0].id))
    }

    console.log(`Updated admin user: ${options.email}`)
  } catch (error) {
    console.error("Failed to create admin user:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

createAdminUser()
