import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(queryClient, { schema })

export function createTransactionClient() {
  const client = postgres(connectionString, { max: 1 })
  return drizzle(client, { schema })
}

export type Database = typeof db
