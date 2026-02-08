/**
 * DirectPay IPG Mock Server
 *
 * This simulates the DirectPay.lk Internet Payment Gateway for development/testing.
 *
 * Usage:
 *   node scripts/mock-ipg.js
 *
 * The server will run on port 3001 and provide these endpoints:
 *   POST /api/v1/payment/initiate - Initiate a payment
 *   POST /api/v1/payment/verify - Verify payment status
 *   GET /payment/:sessionId - Payment page (simulated)
 *   POST /payment/:sessionId/complete - Complete payment (for testing)
 */

const http = require("http")
const url = require("url")
const crypto = require("crypto")

const PORT = process.env.MOCK_IPG_PORT || 3001

// In-memory storage for payment sessions
const sessions = new Map()

// Helper to generate signatures (simulating DirectPay's signature verification)
function generateSignature(data, secretKey) {
  const sortedKeys = Object.keys(data).sort()
  const signString = sortedKeys.map((k) => `${k}=${data[k]}`).join("&")
  return crypto.createHmac("sha256", secretKey).update(signString).digest("hex")
}

// Parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on("error", reject)
  })
}

// CORS headers
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key",
  )
}

// JSON response helper
function jsonResponse(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(data))
}

// HTML response helper
function htmlResponse(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html" })
  res.end(html)
}

// Payment initiation endpoint
async function handleInitiate(req, res) {
  try {
    const body = await parseBody(req)

    // Validate required fields
    const required = [
      "merchantId",
      "amount",
      "currency",
      "orderId",
      "returnUrl",
      "cancelUrl",
    ]
    const missing = required.filter((f) => !body[f])

    if (missing.length > 0) {
      return jsonResponse(res, 400, {
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      })
    }

    // Create session
    const sessionId = crypto.randomUUID()
    const session = {
      id: sessionId,
      merchantId: body.merchantId,
      amount: parseFloat(body.amount),
      currency: body.currency || "LKR",
      orderId: body.orderId,
      description: body.description || "",
      customerEmail: body.customerEmail || "",
      customerPhone: body.customerPhone || "",
      customerName: body.customerName || "",
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
      notifyUrl: body.notifyUrl || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    }

    sessions.set(sessionId, session)

    console.log(
      `[IPG] Payment initiated: ${sessionId} for order ${body.orderId}, amount: ${body.amount} ${body.currency}`,
    )

    return jsonResponse(res, 200, {
      success: true,
      sessionId,
      paymentUrl: `http://localhost:${PORT}/payment/${sessionId}`,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    console.error("[IPG] Initiate error:", error)
    return jsonResponse(res, 500, {
      success: false,
      error: "Internal server error",
    })
  }
}

// Payment verification endpoint
async function handleVerify(req, res) {
  try {
    const body = await parseBody(req)

    if (!body.sessionId) {
      return jsonResponse(res, 400, {
        success: false,
        error: "Session ID required",
      })
    }

    const session = sessions.get(body.sessionId)

    if (!session) {
      return jsonResponse(res, 404, {
        success: false,
        error: "Session not found",
      })
    }

    console.log(
      `[IPG] Payment verified: ${body.sessionId}, status: ${session.status}`,
    )

    return jsonResponse(res, 200, {
      success: true,
      sessionId: session.id,
      orderId: session.orderId,
      amount: session.amount,
      currency: session.currency,
      status: session.status,
      transactionId: session.transactionId || null,
      paidAt: session.paidAt || null,
      cardLast4: session.cardLast4 || null,
      cardBrand: session.cardBrand || null,
    })
  } catch (error) {
    console.error("[IPG] Verify error:", error)
    return jsonResponse(res, 500, {
      success: false,
      error: "Internal server error",
    })
  }
}

// Payment page (simulated checkout)
function handlePaymentPage(req, res, sessionId) {
  const session = sessions.get(sessionId)

  if (!session) {
    return htmlResponse(
      res,
      404,
      `
            <html>
            <head><title>Payment Not Found</title></head>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
                <h1>Payment Session Not Found</h1>
                <p>The payment session has expired or does not exist.</p>
            </body>
            </html>
        `,
    )
  }

  if (session.status !== "pending") {
    return htmlResponse(
      res,
      400,
      `
            <html>
            <head><title>Payment Already Processed</title></head>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
                <h1>Payment Already Processed</h1>
                <p>Status: ${session.status}</p>
                <a href="${session.returnUrl}?session_id=${sessionId}&status=${session.status}">Return to merchant</a>
            </body>
            </html>
        `,
    )
  }

  return htmlResponse(
    res,
    200,
    `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DirectPay IPG (Mock)</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                * { box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0; padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                .container {
                    max-width: 400px; margin: 0 auto;
                    background: white; border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                .header {
                    background: #1a1a2e; color: white;
                    padding: 20px; text-align: center;
                }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0 0; opacity: 0.8; font-size: 14px; }
                .content { padding: 30px; }
                .amount {
                    text-align: center; padding: 20px;
                    background: #f8f9fa; border-radius: 8px;
                    margin-bottom: 20px;
                }
                .amount .value { font-size: 32px; font-weight: bold; color: #2d3748; }
                .amount .label { color: #718096; font-size: 14px; }
                .order-info { margin-bottom: 20px; font-size: 14px; color: #4a5568; }
                .order-info p { margin: 5px 0; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #4a5568; }
                .form-group input {
                    width: 100%; padding: 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px; font-size: 16px;
                }
                .form-group input:focus {
                    outline: none; border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
                }
                .card-row { display: flex; gap: 10px; }
                .card-row .form-group { flex: 1; }
                .btn {
                    width: 100%; padding: 14px;
                    border: none; border-radius: 6px;
                    font-size: 16px; font-weight: 600;
                    cursor: pointer; transition: all 0.2s;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
                .btn-secondary { background: #e2e8f0; color: #4a5568; margin-top: 10px; }
                .btn-secondary:hover { background: #cbd5e0; }
                .test-note {
                    margin-top: 20px; padding: 15px;
                    background: #fff3cd; border-radius: 6px;
                    font-size: 12px; color: #856404;
                }
                .test-note strong { display: block; margin-bottom: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💳 DirectPay IPG</h1>
                    <p>Mock Payment Gateway</p>
                </div>
                <div class="content">
                    <div class="amount">
                        <div class="label">Amount to Pay</div>
                        <div class="value">${session.currency} ${session.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    </div>
                    
                    <div class="order-info">
                        <p><strong>Order:</strong> ${session.orderId}</p>
                        ${session.description ? `<p><strong>Description:</strong> ${session.description}</p>` : ""}
                    </div>

                    <form action="/payment/${sessionId}/complete" method="POST">
                        <div class="form-group">
                            <label>Card Number</label>
                            <input type="text" name="cardNumber" placeholder="4242 4242 4242 4242" maxlength="19" required>
                        </div>
                        
                        <div class="card-row">
                            <div class="form-group">
                                <label>Expiry</label>
                                <input type="text" name="expiry" placeholder="MM/YY" maxlength="5" required>
                            </div>
                            <div class="form-group">
                                <label>CVV</label>
                                <input type="text" name="cvv" placeholder="123" maxlength="4" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Cardholder Name</label>
                            <input type="text" name="cardName" placeholder="JOHN DOE" required>
                        </div>

                        <button type="submit" class="btn btn-primary">Pay ${session.currency} ${session.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</button>
                    </form>

                    <form action="/payment/${sessionId}/cancel" method="POST">
                        <button type="submit" class="btn btn-secondary">Cancel Payment</button>
                    </form>

                    <div class="test-note">
                        <strong>🧪 Test Mode</strong>
                        Use card <code>4242 4242 4242 4242</code> for success.<br>
                        Use card <code>4000 0000 0000 0002</code> to simulate decline.
                    </div>
                </div>
            </div>
        </body>
        </html>
    `,
  )
}

// Complete payment (process form submission)
async function handleCompletePayment(req, res, sessionId) {
  const session = sessions.get(sessionId)

  if (!session || session.status !== "pending") {
    return res.writeHead(302, { Location: session?.cancelUrl || "/" }).end()
  }

  const body = await parseBody(req)
  const cardNumber = (body.cardNumber || "").replace(/\s/g, "")

  // Simulate different card behaviors
  if (cardNumber.startsWith("4000000000000002")) {
    // Decline
    session.status = "failed"
    session.failureReason = "Card declined"
    console.log(`[IPG] Payment DECLINED: ${sessionId}`)

    // Redirect to return URL with failure
    return res
      .writeHead(302, {
        Location: `${session.returnUrl}?session_id=${sessionId}&status=failed&error=card_declined`,
      })
      .end()
  }

  // Success
  session.status = "completed"
  session.transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  session.paidAt = new Date().toISOString()
  session.cardLast4 = cardNumber.slice(-4)
  session.cardBrand = cardNumber.startsWith("4")
    ? "Visa"
    : cardNumber.startsWith("5")
      ? "Mastercard"
      : "Card"

  console.log(
    `[IPG] Payment COMPLETED: ${sessionId}, Transaction: ${session.transactionId}`,
  )

  // Send webhook notification if configured
  if (session.notifyUrl) {
    try {
      const notifyData = JSON.stringify({
        event: "payment.completed",
        sessionId: session.id,
        orderId: session.orderId,
        transactionId: session.transactionId,
        amount: session.amount,
        currency: session.currency,
        status: session.status,
        paidAt: session.paidAt,
      })

      // Fire and forget webhook
      const notifyUrl = new URL(session.notifyUrl)
      const notifyReq = http.request({
        hostname: notifyUrl.hostname,
        port: notifyUrl.port || 80,
        path: notifyUrl.pathname,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      notifyReq.write(notifyData)
      notifyReq.end()
      console.log(`[IPG] Webhook sent to: ${session.notifyUrl}`)
    } catch (e) {
      console.error("[IPG] Webhook failed:", e.message)
    }
  }

  // Redirect to return URL
  return res
    .writeHead(302, {
      Location: `${session.returnUrl}?session_id=${sessionId}&status=completed&transaction_id=${session.transactionId}`,
    })
    .end()
}

// Cancel payment
async function handleCancelPayment(req, res, sessionId) {
  const session = sessions.get(sessionId)

  if (session && session.status === "pending") {
    session.status = "cancelled"
    console.log(`[IPG] Payment CANCELLED: ${sessionId}`)
  }

  const cancelUrl = session?.cancelUrl || "/"
  return res
    .writeHead(302, {
      Location: `${cancelUrl}?session_id=${sessionId}&status=cancelled`,
    })
    .end()
}

// Main request handler
async function handleRequest(req, res) {
  setCorsHeaders(res)

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204)
    return res.end()
  }

  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  console.log(`[IPG] ${req.method} ${pathname}`)

  // API Routes
  if (pathname === "/api/v1/payment/initiate" && req.method === "POST") {
    return handleInitiate(req, res)
  }

  if (pathname === "/api/v1/payment/verify" && req.method === "POST") {
    return handleVerify(req, res)
  }

  // Payment page routes
  const paymentPageMatch = pathname.match(/^\/payment\/([^\/]+)$/)
  if (paymentPageMatch && req.method === "GET") {
    return handlePaymentPage(req, res, paymentPageMatch[1])
  }

  const completeMatch = pathname.match(/^\/payment\/([^\/]+)\/complete$/)
  if (completeMatch && req.method === "POST") {
    return handleCompletePayment(req, res, completeMatch[1])
  }

  const cancelMatch = pathname.match(/^\/payment\/([^\/]+)\/cancel$/)
  if (cancelMatch && req.method === "POST") {
    return handleCancelPayment(req, res, cancelMatch[1])
  }

  // Health check
  if (pathname === "/health") {
    return jsonResponse(res, 200, {
      status: "ok",
      service: "DirectPay IPG Mock",
    })
  }

  // 404
  return jsonResponse(res, 404, { error: "Not found" })
}

// Start server
const server = http.createServer(handleRequest)

server.listen(PORT, () => {
  console.log("")
  console.log(
    "╔═══════════════════════════════════════════════════════════════╗",
  )
  console.log(
    "║                                                               ║",
  )
  console.log(
    "║   💳 DirectPay IPG Mock Server                                ║",
  )
  console.log(
    "║                                                               ║",
  )
  console.log(
    `║   Running on: http://localhost:${PORT}                          ║`,
  )
  console.log(
    "║                                                               ║",
  )
  console.log(
    "║   Endpoints:                                                  ║",
  )
  console.log(
    "║   POST /api/v1/payment/initiate - Start payment               ║",
  )
  console.log(
    "║   POST /api/v1/payment/verify   - Check payment status        ║",
  )
  console.log(
    "║   GET  /payment/:sessionId      - Payment page                ║",
  )
  console.log(
    "║                                                               ║",
  )
  console.log(
    "║   Test Cards:                                                 ║",
  )
  console.log(
    "║   4242 4242 4242 4242 - Success                               ║",
  )
  console.log(
    "║   4000 0000 0000 0002 - Decline                               ║",
  )
  console.log(
    "║                                                               ║",
  )
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝",
  )
  console.log("")
})
