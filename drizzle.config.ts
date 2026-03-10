import { defineConfig } from "drizzle-kit"

import "dotenv/config"

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/postgres",
  },
  verbose: true,
  strict: true,
})
