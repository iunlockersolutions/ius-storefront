import { relations } from "drizzle-orm"
import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { userRoleEnum } from "./enums"

/**
 * User table - Core authentication table managed by BetterAuth.
 *
 * Core fields (BetterAuth CLI generated):
 * - id, name, email, emailVerified, image, createdAt, updatedAt
 *
 * Admin plugin fields:
 * - role, banned, banReason, banExpires
 *
 * Custom application fields:
 * - mustChangePassword, invitedBy, invitedAt, lastPasswordChange
 */
export const user = pgTable("user", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // BetterAuth Admin plugin fields
  // @see https://www.better-auth.com/docs/plugins/admin#schema
  role: text("role").default("customer"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  // Custom application fields for user management
  mustChangePassword: boolean("must_change_password").default(false),
  invitedBy: uuid("invited_by"),
  invitedAt: timestamp("invited_at"),
  lastPasswordChange: timestamp("last_password_change"),
})

/**
 * Session table - Active user sessions managed by BetterAuth.
 *
 * Core fields (BetterAuth CLI generated):
 * - id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId
 *
 * Admin plugin fields:
 * - impersonatedBy
 *
 * @see https://www.better-auth.com/docs/concepts/database#session
 */
export const session = pgTable(
  "session",
  {
    // BetterAuth Core fields
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // BetterAuth Admin plugin field
    // @see https://www.better-auth.com/docs/plugins/admin#schema
    impersonatedBy: uuid("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
)

/**
 * Account table - OAuth/credential accounts managed by BetterAuth.
 * For email/password auth, password hash is stored here (not in user table).
 *
 * @see https://www.better-auth.com/docs/concepts/database#account
 */
export const account = pgTable(
  "account",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
)

/**
 * Verification table - Email verification, password reset tokens.
 *
 * @see https://www.better-auth.com/docs/concepts/database#verification
 */
export const verification = pgTable(
  "verification",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

/**
 * Passkey table - WebAuthn credentials managed by BetterAuth Passkey plugin.
 *
 * @see https://www.better-auth.com/docs/plugins/passkey#schema
 */
export const passkey = pgTable(
  "passkey",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    createdAt: timestamp("created_at").defaultNow(),
    aaguid: text("aaguid"),
  },
  (table) => [index("passkey_userId_idx").on(table.userId)],
)

/**
 * Custom Application Tables
 *
 * These tables extend BetterAuth with our application-specific features.
 */

/**
 * Roles table - Available roles in the system.
 */
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: userRoleEnum("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/**
 * User roles junction table - Maps users to roles.
 * A user can have multiple roles.
 * References BetterAuth's user table (text id).
 */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedBy: uuid("assigned_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_id_idx").on(table.roleId),
  ],
)

// BetterAuth Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  userRoles: many(userRoles),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, {
    fields: [passkey.userId],
    references: [user.id],
  }),
}))

// Application Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(user, {
    fields: [userRoles.userId],
    references: [user.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(user, {
    fields: [userRoles.assignedBy],
    references: [user.id],
    relationName: "assignedByUser",
  }),
}))

// Export aliases for backward compatibility
export const users = user
export const sessions = session
export const accounts = account
export const verifications = verification
export const passkeys = passkey
