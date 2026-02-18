import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

// Optimized connection pooling for Vercel serverless
const queryClient = postgres(connectionString, {
  max: 1, // Single connection per serverless function instance
  idle_timeout: 60, // Increased for better connection reuse
  connect_timeout: 30, // More lenient timeout for cold starts
  max_lifetime: 60 * 30, // 30 minutes connection lifetime
  prepare: false, // Disable prepared statements for better serverless compatibility
})

export const db = drizzle(queryClient, { schema })

export function createTransactionClient() {
  const client = postgres(connectionString, { max: 1 })
  return drizzle(client, { schema })
}

export type Database = typeof db
