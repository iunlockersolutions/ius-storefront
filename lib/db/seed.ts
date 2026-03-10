import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { account, user } from "./schema"

import "dotenv/config"

async function seed() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set")
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  console.log("🌱 Starting bootstrap seed...\n")

  try {
    const adminEmail = "admin@example.com"
    const adminPassword = "admin123"

    console.log("👤 Ensuring bootstrap admin user exists...")
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1)

    if (existingAdmin.length === 0) {
      const [adminUser] = await db
        .insert(user)
        .values({
          email: adminEmail,
          emailVerified: true,
          name: "System Admin",
          role: "admin",
        })
        .returning()

      const passwordHash = await hashPassword(adminPassword)

      await db.insert(account).values({
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: passwordHash,
      })

      console.log(`  ✅ Created admin user: ${adminEmail}`)
    } else {
      const [adminUser] = existingAdmin
      const passwordHash = await hashPassword(adminPassword)

      await db
        .update(user)
        .set({
          role: "admin",
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, adminUser.id))

      await db
        .update(account)
        .set({ password: passwordHash })
        .where(eq(account.userId, adminUser.id))

      console.log(`  🔄 Updated admin credentials: ${adminEmail}`)
    }

    console.log(
      `  ⚠️  Default password: ${adminPassword} (CHANGE IN PRODUCTION)`,
    )
    console.log("\n✅ Bootstrap seed completed successfully!")
  } catch (error) {
    console.error("\n❌ Seed failed:", error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
