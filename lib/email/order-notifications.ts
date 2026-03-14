/**
 * Transactional order email templates and provider dispatch.
 */

interface OrderEmailData {
  orderId?: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: string
  subtotal?: string
  shippingCost?: string
  taxAmount?: string
  discountAmount?: string
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
  paymentMethodLabel?: string
  paymentSummaryTitle?: string
  paymentSummaryBody?: string
  primaryActionLabel?: string
  primaryActionUrl?: string
  secondaryActionLabel?: string
  secondaryActionUrl?: string
  trackingNumber?: string
  trackingUrl?: string
}

const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "noreply@ius-storefront.com",
  replyTo: process.env.EMAIL_REPLY_TO || "support@ius-storefront.com",
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "IUS Shop",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
}

function renderItemsHtml(items: OrderEmailData["items"]) {
  return items
    .map(
      (item) => `
        <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #eee;">
          <span>${item.name} × ${item.quantity}</span>
          <span style="font-weight:500;">${item.price}</span>
        </div>
      `,
    )
    .join("")
}

function renderItemsText(items: OrderEmailData["items"]) {
  return items
    .map((item) => `- ${item.name} x${item.quantity} - ${item.price}`)
    .join("\n")
}

function renderAddressHtml(address: OrderEmailData["shippingAddress"]) {
  if (!address) {
    return ""
  }

  return `
    <div style="margin-bottom:20px;">
      <h3 style="margin-bottom:8px;">Shipping Address</h3>
      <p style="margin:0;">
        ${address.recipientName}<br>
        ${address.addressLine1}<br>
        ${address.addressLine2 ? `${address.addressLine2}<br>` : ""}
        ${address.city}, ${address.state} ${address.postalCode}<br>
        ${address.country}
      </p>
    </div>
  `
}

function renderAddressText(address: OrderEmailData["shippingAddress"]) {
  if (!address) {
    return ""
  }

  return `Shipping Address:
${address.recipientName}
${address.addressLine1}
${address.addressLine2 || ""}
${address.city}, ${address.state} ${address.postalCode}
${address.country}`
}

function renderActionsHtml(data: OrderEmailData) {
  if (!data.primaryActionUrl && !data.secondaryActionUrl) {
    return ""
  }

  return `
    <div style="margin-top:28px;text-align:center;">
      ${
        data.primaryActionUrl && data.primaryActionLabel
          ? `<a href="${data.primaryActionUrl}" style="display:inline-block;background:#111827;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">${data.primaryActionLabel}</a>`
          : ""
      }
      ${
        data.secondaryActionUrl && data.secondaryActionLabel
          ? `<div style="margin-top:14px;"><a href="${data.secondaryActionUrl}" style="color:#2563eb;text-decoration:none;">${data.secondaryActionLabel}</a></div>`
          : ""
      }
    </div>
  `
}

function renderActionsText(data: OrderEmailData) {
  const lines = []

  if (data.primaryActionUrl && data.primaryActionLabel) {
    lines.push(`${data.primaryActionLabel}: ${data.primaryActionUrl}`)
  }

  if (data.secondaryActionUrl && data.secondaryActionLabel) {
    lines.push(`${data.secondaryActionLabel}: ${data.secondaryActionUrl}`)
  }

  return lines.join("\n")
}

function renderTotalsHtml(data: OrderEmailData) {
  return `
    <div style="margin-top:16px;">
      ${
        data.subtotal
          ? `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">Subtotal</span><span>${data.subtotal}</span></div>`
          : ""
      }
      ${
        data.shippingCost
          ? `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">Shipping</span><span>${data.shippingCost}</span></div>`
          : ""
      }
      ${
        data.taxAmount
          ? `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">Tax</span><span>${data.taxAmount}</span></div>`
          : ""
      }
      ${
        data.discountAmount && data.discountAmount !== "LKR 0.00"
          ? `<div style="display:flex;justify-content:space-between;padding:6px 0;color:#16a34a;"><span>Discount</span><span>-${data.discountAmount}</span></div>`
          : ""
      }
      <div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:10px;border-top:1px solid #eee;font-size:18px;font-weight:700;">
        <span>Total</span>
        <span>${data.total}</span>
      </div>
    </div>
  `
}

function renderTotalsText(data: OrderEmailData) {
  const lines = []

  if (data.subtotal) {
    lines.push(`Subtotal: ${data.subtotal}`)
  }

  if (data.shippingCost) {
    lines.push(`Shipping: ${data.shippingCost}`)
  }

  if (data.taxAmount) {
    lines.push(`Tax: ${data.taxAmount}`)
  }

  if (data.discountAmount && data.discountAmount !== "LKR 0.00") {
    lines.push(`Discount: -${data.discountAmount}`)
  }

  lines.push(`Total: ${data.total}`)

  return lines.join("\n")
}

function getOrderConfirmationTemplate(data: OrderEmailData) {
  const subject = `Order Received - ${data.orderNumber}`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Received</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#000;margin:0;">${EMAIL_CONFIG.siteName}</h1>
  </div>

  <div style="background:#f8fafc;border-radius:12px;padding:28px;margin-bottom:24px;">
    <h2 style="margin:0 0 12px;color:#111827;">Order Received</h2>
    <p>Hi ${data.customerName},</p>
    <p>We’ve received your order and saved the invoice details below.</p>
    ${
      data.paymentSummaryTitle
        ? `<div style="background:white;border-radius:10px;padding:18px;margin-top:20px;">
            <p style="margin:0 0 6px;font-weight:700;">${data.paymentSummaryTitle}</p>
            <p style="margin:0;color:#4b5563;">${data.paymentSummaryBody || ""}</p>
          </div>`
        : ""
    }
    <div style="background:white;border-radius:10px;padding:18px;margin-top:20px;">
      <p style="margin:0;color:#666;">Order Number</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:700;font-family:monospace;">${data.orderNumber}</p>
    </div>
  </div>

  <div style="margin-bottom:24px;">
    <h3 style="margin-bottom:12px;">Order Details</h3>
    ${renderItemsHtml(data.items)}
    ${renderTotalsHtml(data)}
  </div>

  ${renderAddressHtml(data.shippingAddress)}

  ${
    data.paymentMethodLabel
      ? `<div style="margin-bottom:20px;">
          <h3 style="margin-bottom:8px;">Payment Method</h3>
          <p style="margin:0;">${data.paymentMethodLabel}</p>
        </div>`
      : ""
  }

  ${renderActionsHtml(data)}

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#666;font-size:14px;">
    <p>Questions? Contact us at ${EMAIL_CONFIG.replyTo}</p>
    <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.siteName}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Order Received - ${data.orderNumber}

Hi ${data.customerName},

We’ve received your order and saved the invoice details below.
${data.paymentSummaryTitle ? `\n${data.paymentSummaryTitle}\n${data.paymentSummaryBody || ""}\n` : ""}
Order Number: ${data.orderNumber}

Order Details:
${renderItemsText(data.items)}

${renderTotalsText(data)}

${renderAddressText(data.shippingAddress)}
${data.paymentMethodLabel ? `\nPayment Method: ${data.paymentMethodLabel}` : ""}

${renderActionsText(data)}

Questions? Contact us at ${EMAIL_CONFIG.replyTo}
  `.trim()

  return { subject, html, text }
}

function getOrderInvoiceTemplate(data: OrderEmailData) {
  const subject = `Invoice - ${data.orderNumber}`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#000;margin:0;">${EMAIL_CONFIG.siteName}</h1>
  </div>

  <div style="background:#ecfeff;border-radius:12px;padding:28px;margin-bottom:24px;">
    <h2 style="margin:0 0 12px;color:#0f172a;">Invoice / Receipt</h2>
    <p>Hi ${data.customerName},</p>
    <p>${data.paymentSummaryBody || "Your invoice is ready."}</p>
    <div style="background:white;border-radius:10px;padding:18px;margin-top:20px;">
      <p style="margin:0;color:#666;">Order Number</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:700;font-family:monospace;">${data.orderNumber}</p>
    </div>
  </div>

  <div style="margin-bottom:24px;">
    <h3 style="margin-bottom:12px;">Invoice Details</h3>
    ${renderItemsHtml(data.items)}
    ${renderTotalsHtml(data)}
  </div>

  ${renderAddressHtml(data.shippingAddress)}

  ${
    data.paymentMethodLabel
      ? `<div style="margin-bottom:20px;">
          <h3 style="margin-bottom:8px;">Payment</h3>
          <p style="margin:0;">${data.paymentMethodLabel}</p>
          ${
            data.paymentSummaryTitle
              ? `<p style="margin:6px 0 0;color:#4b5563;">${data.paymentSummaryTitle}</p>`
              : ""
          }
        </div>`
      : ""
  }

  ${renderActionsHtml(data)}

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#666;font-size:14px;">
    <p>Questions? Contact us at ${EMAIL_CONFIG.replyTo}</p>
    <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.siteName}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Invoice - ${data.orderNumber}

Hi ${data.customerName},

${data.paymentSummaryBody || "Your invoice is ready."}

Order Number: ${data.orderNumber}

Order Details:
${renderItemsText(data.items)}

${renderTotalsText(data)}

${renderAddressText(data.shippingAddress)}
${data.paymentMethodLabel ? `\nPayment Method: ${data.paymentMethodLabel}` : ""}
${data.paymentSummaryTitle ? `\nPayment Status: ${data.paymentSummaryTitle}` : ""}

${renderActionsText(data)}

Questions? Contact us at ${EMAIL_CONFIG.replyTo}
  `.trim()

  return { subject, html, text }
}

function getOrderShippedTemplate(data: OrderEmailData) {
  const subject = `Your Order Has Shipped - ${data.orderNumber}`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#000;margin:0;">${EMAIL_CONFIG.siteName}</h1></div>
  <div style="background:#f8f9fa;border-radius:8px;padding:30px;margin-bottom:20px;">
    <h2 style="margin-top:0;color:#7c3aed;">Your Order is On Its Way</h2>
    <p>Hi ${data.customerName},</p>
    <p>Your order has shipped and is on its way to you.</p>
    <div style="background:white;border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:0;color:#666;">Order Number</p>
      <p style="margin:5px 0;font-size:20px;font-weight:bold;font-family:monospace;">${data.orderNumber}</p>
      ${data.trackingNumber ? `<p style="margin:14px 0 0;color:#666;">Tracking Number</p><p style="margin:5px 0;font-size:18px;font-weight:bold;font-family:monospace;">${data.trackingNumber}</p>` : ""}
    </div>
    ${data.trackingUrl ? `<div style="text-align:center;"><a href="${data.trackingUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;">Track Your Package</a></div>` : ""}
  </div>
  ${renderAddressHtml(data.shippingAddress)}
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#666;font-size:14px;">
    <p>Questions? Contact us at ${EMAIL_CONFIG.replyTo}</p>
    <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.siteName}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Your Order Has Shipped - ${data.orderNumber}

Hi ${data.customerName},

Your order has shipped and is on its way to you.

Order Number: ${data.orderNumber}
${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ""}
${data.trackingUrl ? `Track your package: ${data.trackingUrl}` : ""}

${renderAddressText(data.shippingAddress)}

Questions? Contact us at ${EMAIL_CONFIG.replyTo}
  `.trim()

  return { subject, html, text }
}

function getOrderDeliveredTemplate(data: OrderEmailData) {
  const subject = `Order Delivered - ${data.orderNumber}`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#000;margin:0;">${EMAIL_CONFIG.siteName}</h1></div>
  <div style="background:#f8f9fa;border-radius:8px;padding:30px;margin-bottom:20px;">
    <h2 style="margin-top:0;color:#16a34a;">Order Delivered</h2>
    <p>Hi ${data.customerName},</p>
    <p>Your order has been delivered. We hope you love your purchase.</p>
    <div style="background:white;border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:0;color:#666;">Order Number</p>
      <p style="margin:5px 0;font-size:20px;font-weight:bold;font-family:monospace;">${data.orderNumber}</p>
    </div>
  </div>
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#666;font-size:14px;">
    <p>Need help? Contact us at ${EMAIL_CONFIG.replyTo}</p>
    <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.siteName}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Order Delivered - ${data.orderNumber}

Hi ${data.customerName},

Your order has been delivered. We hope you love your purchase.

Order Number: ${data.orderNumber}

Need help? Contact us at ${EMAIL_CONFIG.replyTo}
  `.trim()

  return { subject, html, text }
}

async function sendEmail(
  to: string,
  template: { subject: string; html: string; text: string },
): Promise<boolean> {
  if (process.env.EMAIL_PROVIDER === "none" || !process.env.EMAIL_PROVIDER) {
    console.log(`[Email - Dev Mode] Would send email to ${to}:`)
    console.log(`Subject: ${template.subject}`)
    console.log("---")
    console.log(template.text)
    console.log("---")
    return true
  }

  try {
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

    console.warn(`Unknown email provider: ${process.env.EMAIL_PROVIDER}`)
    return false
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  return sendEmail(data.customerEmail, getOrderConfirmationTemplate(data))
}

export async function sendOrderInvoiceEmail(data: OrderEmailData) {
  return sendEmail(data.customerEmail, getOrderInvoiceTemplate(data))
}

export async function sendOrderShippedEmail(data: OrderEmailData) {
  return sendEmail(data.customerEmail, getOrderShippedTemplate(data))
}

export async function sendOrderDeliveredEmail(data: OrderEmailData) {
  return sendEmail(data.customerEmail, getOrderDeliveredTemplate(data))
}

export type { OrderEmailData }
