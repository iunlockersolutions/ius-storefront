import { emailConfig, isEmailConfigured, resend } from "./resend"

/**
 * Email template types
 */
export type EmailTemplate =
  | "welcome"
  | "staff-invitation"
  | "password-reset"
  | "password-changed"
  | "password-reset-by-admin"
  | "order-confirmation"
  | "order-shipped"
  | "order-delivered"

/**
 * Email template data types
 */
interface WelcomeData {
  name: string
}

interface StaffInvitationData {
  name: string
  email: string
  temporaryPassword: string
  role: string
  invitedByName: string
  loginUrl: string
}

interface PasswordResetData {
  name: string
  url: string
}

interface PasswordChangedData {
  name: string
}

interface PasswordResetByAdminData {
  name: string
  temporaryPassword: string
  loginUrl: string
  adminName: string
}

type TemplateDataMap = {
  welcome: WelcomeData
  "staff-invitation": StaffInvitationData
  "password-reset": PasswordResetData
  "password-changed": PasswordChangedData
  "password-reset-by-admin": PasswordResetByAdminData
  "order-confirmation": Record<string, unknown>
  "order-shipped": Record<string, unknown>
  "order-delivered": Record<string, unknown>
}

/**
 * Send email options
 */
interface SendEmailOptions<T extends EmailTemplate> {
  to: string
  subject: string
  template: T
  data: TemplateDataMap[T]
}

/**
 * Generate email HTML from template
 */
function generateEmailHtml<T extends EmailTemplate>(
  template: T,
  data: TemplateDataMap[T],
): string {
  switch (template) {
    case "welcome":
      return generateWelcomeEmail(data as WelcomeData)
    case "staff-invitation":
      return generateStaffInvitationEmail(data as StaffInvitationData)
    case "password-reset":
      return generatePasswordResetEmail(data as PasswordResetData)
    case "password-changed":
      return generatePasswordChangedEmail(data as PasswordChangedData)
    case "password-reset-by-admin":
      return generatePasswordResetByAdminEmail(data as PasswordResetByAdminData)
    default:
      return `<p>Email template not found</p>`
  }
}

/**
 * Send an email using Resend
 */
export async function sendEmail<T extends EmailTemplate>(
  options: SendEmailOptions<T>,
): Promise<{ success: boolean; error?: string }> {
  // Check if email is configured
  if (!isEmailConfigured) {
    console.warn(
      "Email not configured (RESEND_API_KEY missing). Skipping email send.",
    )
    // Return success in development to allow testing without email
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Development mode: Email would have been sent to:",
        options.to,
      )
      console.log("Subject:", options.subject)
      return { success: true }
    }
    return { success: false, error: "Email service not configured" }
  }

  try {
    const html = generateEmailHtml(options.template, options.data)

    const { error } = await resend.emails.send({
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      html,
    })

    if (error) {
      console.error("Failed to send email:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Email sending error:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

// ============================================
// Email Templates
// ============================================

function generateWelcomeEmail(data: WelcomeData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to IUS Shop!</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.name},</p>
            <p style="font-size: 16px;">Thank you for joining IUS Shop! We're excited to have you on board.</p>
            <p style="font-size: 16px;">You can now:</p>
            <ul style="font-size: 16px;">
                <li>Browse our wide selection of products</li>
                <li>Save items to your favorites</li>
                <li>Track your orders</li>
                <li>Leave reviews for products you've purchased</li>
            </ul>
            <p style="font-size: 16px;">If you have any questions, feel free to reach out to our support team.</p>
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>The IUS Shop Team</p>
        </div>
    </body>
    </html>
    `
}

function generateStaffInvitationEmail(data: StaffInvitationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You've Been Invited!</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.name},</p>
            <p style="font-size: 16px;">${data.invitedByName} has invited you to join the IUS Shop admin team as a <strong>${data.role}</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e3a5f;">Your Login Credentials</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${data.temporaryPassword}</code></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Login to Dashboard</a>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-size: 14px;"><strong>Important:</strong> You'll be required to change your password on first login. Please keep your new password secure and do not share it with anyone.</p>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">If you didn't expect this invitation or have any questions, please contact support.</p>
            <p style="font-size: 16px;">Best regards,<br>The IUS Shop Team</p>
        </div>
    </body>
    </html>
    `
}

function generatePasswordResetEmail(data: PasswordResetData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.name},</p>
            <p style="font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>

            <p style="font-size: 14px; color: #666;">This link will expire in 1 hour for security reasons.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>The IUS Shop Team</p>
        </div>
    </body>
    </html>
    `
}

function generatePasswordChangedEmail(data: PasswordChangedData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.name},</p>
            <p style="font-size: 16px;">Your password has been successfully changed.</p>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">✓ Your account password was updated on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })} at ${new Date().toLocaleTimeString("en-US", { timeStyle: "short" })}.</p>
            </div>

            <p style="font-size: 14px; color: #666;">If you did not make this change, please contact our support team immediately and secure your account.</p>
            
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>The IUS Shop Team</p>
        </div>
    </body>
    </html>
    `
}

function generatePasswordResetByAdminEmail(
  data: PasswordResetByAdminData,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset by Administrator</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.name},</p>
            <p style="font-size: 16px;">Your password has been reset by ${data.adminName}. Here are your new login credentials:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e3a5f;">New Login Credentials</h3>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${data.temporaryPassword}</code></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Login Now</a>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-size: 14px;"><strong>Important:</strong> You'll be required to change your password on your next login. Please choose a strong, unique password.</p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">If you did not expect this password reset, please contact support immediately.</p>
            
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>The IUS Shop Team</p>
        </div>
    </body>
    </html>
    `
}
