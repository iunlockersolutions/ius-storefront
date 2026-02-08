/**
 * Email Notification Service
 *
 * Handles sending transactional emails for orders.
 * Uses a provider abstraction to support multiple email services.
 *
 * In production, integrate with:
 * - Resend (recommended)
 * - SendGrid
 * - AWS SES
 * - Nodemailer
 */

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  total: string
  items: Array<{
    name: string
    quantity: number
    price: string
  }>
  shippingAddress: {
    recipientName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  } | null
  trackingNumber?: string
  trackingUrl?: string
}

// Email provider configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "noreply@ius-shop.com",
  replyTo: process.env.EMAIL_REPLY_TO || "support@ius-shop.com",
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "IUS Shop",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
}

// ============================================
// Email Templates
// ============================================

function getOrderConfirmationTemplate(data: OrderEmailData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Order Confirmed - ${data.orderNumber}`

  const itemsList = data.items
    .map((item) => `- ${item.name} x${item.quantity} - ${item.price}`)
    .join("\n")

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #000; margin: 0;">${EMAIL_CONFIG.siteName}</h1>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #16a34a;">✓ Order Confirmed</h2>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for your order! We've received your order and will begin processing it shortly.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">Order Number</p>
            <p style="margin: 5px 0; font-size: 24px; font-weight: bold; font-family: monospace;">${data.orderNumber}</p>
        </div>
    </div>

    <div style="margin-bottom: 20px;">
        <h3>Order Details</h3>
        ${data.items
          .map(
            (item) => `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <span>${item.name} × ${item.quantity}</span>
                <span style="font-weight: 500;">${item.price}</span>
            </div>
        `,
          )
          .join("")}
        <div style="display: flex; justify-content: space-between; padding: 15px 0; font-size: 18px; font-weight: bold;">
            <span>Total</span>
            <span>${data.total}</span>
        </div>
    </div>

    ${
      data.shippingAddress
        ? `
    <div style="margin-bottom: 20px;">
        <h3>Shipping Address</h3>
        <p style="margin: 0;">
            ${data.shippingAddress.recipientName}<br>
            ${data.shippingAddress.addressLine1}<br>
            ${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + "<br>" : ""}
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
            ${data.shippingAddress.country}
        </p>
    </div>
    `
        : ""
    }

    <div style="text-align: center; margin-top: 30px;">
        <a href="${EMAIL_CONFIG.siteUrl}/orders" style="display: inline-block; background: #000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">View Order Status</a>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>Questions? Contact us at ${EMAIL_CONFIG.replyTo}</p>
        <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.siteName}. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim()

  const text = `
Order Confirmed - ${data.orderNumber}

Hi ${data.customerName},

Thank you for your order! We've received your order and will begin processing it shortly.

Order Number: ${data.orderNumber}

Order Details:
${itemsList}

Total: ${data.total}

${
  data.shippingAddress
    ? `Shipping Address:
${data.shippingAddress.recipientName}
${data.shippingAddress.addressLine1}
${data.shippingAddress.addressLine2 || ""}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}`
    : ""
}

View your order: ${EMAIL_CONFIG.siteUrl}/orders

Questions? Contact us at ${EMAIL_CONFIG.replyTo}
    `.trim()

  return { subject, html, text }
}

function getOrderShippedTemplate(data: OrderEmailData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Your Order Has Shipped - ${data.orderNumber}`

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Shipped</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #000; margin: 0;">${EMAIL_CONFIG.siteName}</h1>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #7c3aed;">📦 Your Order is On Its Way!</h2>
        <p>Hi ${data.customerName},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">Order Number</p>
            <p style="margin: 5px 0; font-size: 20px; font-weight: bold; font-family: monospace;">${data.orderNumber}</p>
            ${
              data.trackingNumber
                ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <p style="margin: 0; color: #666;">Tracking Number</p>
                <p style="margin: 5px 0; font-size: 18px; font-weight: bold; font-family: monospace;">${data.trackingNumber}</p>
            </div>
            `
                : ""
            }
        </div>

        ${
          data.trackingUrl
            ? `
        <div style="text-align: center;">
            <a href="${data.trackingUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Track Your Package</a>
        </div>
        `
            : ""
        }
    </div>

    ${
      data.shippingAddress
        ? `
    <div style="margin-bottom: 20px;">
        <h3>Delivering To</h3>
        <p style="margin: 0;">
            ${data.shippingAddress.recipientName}<br>
            ${data.shippingAddress.addressLine1}<br>
            ${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + "<br>" : ""}
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
            ${data.shippingAddress.country}
        </p>
    </div>
    `
        : ""
    }

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>Questions? Contact us at ${EMAIL_CONFIG.replyTo}</p>
        <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.siteName}. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim()

  const text = `
Your Order Has Shipped - ${data.orderNumber}

Hi ${data.customerName},

Great news! Your order has been shipped and is on its way to you.

Order Number: ${data.orderNumber}
${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ""}
${data.trackingUrl ? `Track your package: ${data.trackingUrl}` : ""}

${
  data.shippingAddress
    ? `Delivering To:
${data.shippingAddress.recipientName}
${data.shippingAddress.addressLine1}
${data.shippingAddress.addressLine2 || ""}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}`
    : ""
}

Questions? Contact us at ${EMAIL_CONFIG.replyTo}
    `.trim()

  return { subject, html, text }
}

function getOrderDeliveredTemplate(data: OrderEmailData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Order Delivered - ${data.orderNumber}`

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Delivered</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #000; margin: 0;">${EMAIL_CONFIG.siteName}</h1>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #16a34a;">✓ Order Delivered!</h2>
        <p>Hi ${data.customerName},</p>
        <p>Your order has been delivered! We hope you love your purchase.</p>

        <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">Order Number</p>
            <p style="margin: 5px 0; font-size: 20px; font-weight: bold; font-family: monospace;">${data.orderNumber}</p>
        </div>
    </div>

    <div style="text-align: center; background: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #92400e;">⭐ Leave a Review</h3>
        <p style="margin-bottom: 15px; color: #92400e;">Your feedback helps other customers make informed decisions.</p>
        <a href="${EMAIL_CONFIG.siteUrl}/orders/${data.orderNumber}" style="display: inline-block; background: #f59e0b; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px;">Write a Review</a>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>Need help? Contact us at ${EMAIL_CONFIG.replyTo}</p>
        <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.siteName}. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim()

  const text = `
Order Delivered - ${data.orderNumber}

Hi ${data.customerName},

Your order has been delivered! We hope you love your purchase.

Order Number: ${data.orderNumber}

Leave a Review
Your feedback helps other customers make informed decisions.
Write a review: ${EMAIL_CONFIG.siteUrl}/orders/${data.orderNumber}

Need help? Contact us at ${EMAIL_CONFIG.replyTo}
    `.trim()

  return { subject, html, text }
}

// ============================================
// Email Sending Functions
// ============================================

async function sendEmail(
  to: string,
  template: { subject: string; html: string; text: string },
): Promise<boolean> {
  // Check if email sending is enabled
  if (process.env.EMAIL_PROVIDER === "none" || !process.env.EMAIL_PROVIDER) {
    console.log(`[Email - Dev Mode] Would send email to ${to}:`)
    console.log(`Subject: ${template.subject}`)
    console.log("---")
    console.log(template.text)
    console.log("---")
    return true
  }

  try {
    // Resend integration example
    if (process.env.EMAIL_PROVIDER === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_CONFIG.from,
          to: [to],
          reply_to: EMAIL_CONFIG.replyTo,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("Failed to send email via Resend:", error)
        return false
      }

      return true
    }

    // Add other providers here (SendGrid, AWS SES, etc.)

    console.warn(`Unknown email provider: ${process.env.EMAIL_PROVIDER}`)
    return false
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

// ============================================
// Public API
// ============================================

export async function sendOrderConfirmationEmail(
  data: OrderEmailData,
): Promise<boolean> {
  const template = getOrderConfirmationTemplate(data)
  return sendEmail(data.customerEmail, template)
}

export async function sendOrderShippedEmail(
  data: OrderEmailData,
): Promise<boolean> {
  const template = getOrderShippedTemplate(data)
  return sendEmail(data.customerEmail, template)
}

export async function sendOrderDeliveredEmail(
  data: OrderEmailData,
): Promise<boolean> {
  const template = getOrderDeliveredTemplate(data)
  return sendEmail(data.customerEmail, template)
}

export type { OrderEmailData }
