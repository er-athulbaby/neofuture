import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOrderConfirmation(
  to: string,
  order: { orderNumber: string; total: number; items: { name: string; quantity: number; price: number }[] }
) {
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td>x${i.quantity}</td><td>₹${i.price}</td></tr>`
    )
    .join('')

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Order Confirmed — ${order.orderNumber} | NeoFuture`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#D4236A">Thank you for your order!</h2>
        <p>Order number: <strong>${order.orderNumber}</strong></p>
        <table width="100%" cellpadding="8" style="border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f9e4ef">
            <th align="left">Product</th><th>Qty</th><th>Price</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p><strong>Total: ₹${order.total}</strong></p>
        <p style="color:#666">We'll notify you when your order ships. For support, reply to this email.</p>
        <hr/>
        <p style="font-size:12px;color:#999">NeoFuture — From trusted hands to quality lives</p>
      </div>
    `,
  })
}

export async function sendPasswordReset(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Reset your NeoFuture password',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#D4236A">Password Reset Request</h2>
        <p>We received a request to reset your NeoFuture account password.</p>
        <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#D4236A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          Reset My Password
        </a>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
        <hr/>
        <p style="font-size:12px;color:#999">NeoFuture — From trusted hands to quality lives</p>
      </div>
    `,
  })
}

export async function sendAbandonedCartEmail(
  to: string,
  cart: { items: { name: string; quantity: number; price: number; image?: string }[]; subtotal: number; siteUrl: string }
) {
  const itemsHtml = cart.items
    .map((i) => `<tr><td style="padding:8px 0">${i.name}</td><td style="padding:8px 0;text-align:right">×${i.quantity}</td><td style="padding:8px 0;text-align:right">₹${i.price}</td></tr>`)
    .join('')

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'You left something behind 🛍️ | NeoFuture',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#D4236A">Your cart misses you!</h2>
        <p>You left some items in your cart. They're still waiting for you.</p>
        <table width="100%" cellpadding="0" style="border-collapse:collapse;margin:16px 0;border-top:1px solid #eee">
          ${itemsHtml}
          <tr style="border-top:2px solid #eee">
            <td colspan="2" style="padding:10px 0;font-weight:bold">Total</td>
            <td style="padding:10px 0;font-weight:bold;text-align:right">₹${cart.subtotal}</td>
          </tr>
        </table>
        <a href="${cart.siteUrl}/cart" style="display:inline-block;background:#D4236A;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;margin:8px 0">
          Complete My Order →
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          If you've already placed your order, please ignore this email.<br/>
          NeoFuture — From trusted hands to quality lives
        </p>
      </div>
    `,
  })
}

export async function sendShippingUpdate(
  to: string,
  order: { orderNumber: string; trackingNumber: string }
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Your order ${order.orderNumber} has shipped! | NeoFuture`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#D4236A">Your order is on its way!</h2>
        <p>Order: <strong>${order.orderNumber}</strong></p>
        <p>Tracking number: <strong>${order.trackingNumber}</strong></p>
        <p style="color:#666">Your NeoFuture products are being delivered. Track your shipment with the courier using the tracking number above.</p>
        <hr/>
        <p style="font-size:12px;color:#999">NeoFuture — From trusted hands to quality lives</p>
      </div>
    `,
  })
}
