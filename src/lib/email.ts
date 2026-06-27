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
