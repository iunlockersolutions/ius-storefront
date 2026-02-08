import { Resend } from "resend"

/**
 * Resend Email Client
 *
 * Configured instance of Resend for sending transactional emails.
 * Falls back to a placeholder key if not configured (will fail gracefully on send).
 */
export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder")

/**
 * Check if email sending is properly configured
 */
export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY)

/**
 * Default email configuration
 */
export const emailConfig = {
  from: process.env.EMAIL_FROM || "IUS Shop <noreply@code-dock.d>",
  replyTo: process.env.EMAIL_REPLY_TO || "support@example.com",
}
