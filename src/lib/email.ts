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
  order: {
    orderNumber: string
    orderId?: number
    total: number
    subtotal?: number
    discount?: number
    shipping?: number
    tax?: number
    items: { name: string; quantity: number; price: number }[]
    shippingAddress?: { name?: string; line1?: string; city?: string; state?: string; pincode?: string }
  }
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const invoiceUrl = order.orderId ? `${siteUrl}/order/${order.orderId}/invoice` : null

  const itemsHtml = order.items
    .map((i) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e6f0">${i.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e6f0;text-align:center">×${i.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e6f0;text-align:right">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
      </tr>`)
    .join('')

  const subtotal = order.subtotal ?? order.total
  const discount = order.discount ?? 0
  const shipping = order.shipping ?? 0
  const tax = order.tax ?? 0

  const addr = order.shippingAddress
  const addrHtml = addr ? `
    <div style="margin:20px 0;padding:14px 16px;background:#f9f4fb;border-radius:8px;font-size:13px">
      <strong style="color:#555">Shipping To</strong><br/>
      <span style="color:#333">${addr.name ?? ''}</span><br/>
      <span style="color:#666">${addr.line1 ?? ''}, ${addr.city ?? ''}, ${addr.state ?? ''} – ${addr.pincode ?? ''}</span>
    </div>` : ''

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Order Confirmed — #${order.orderNumber} | NeoFuture`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1A1535">
        <!-- Header -->
        <div style="background:#D4236A;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
          <p style="color:#fff;font-size:22px;font-weight:800;margin:0">
            <span style="color:#ffd6ea">neo</span>future™
          </p>
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0">From trusted hands to quality lives</p>
        </div>

        <!-- Body -->
        <div style="background:#fff;padding:32px;border:1px solid #f0e6f0;border-top:none">
          <h2 style="margin:0 0 8px;font-size:20px">Order Confirmed!</h2>
          <p style="color:#666;margin:0 0 20px">Thank you for shopping with NeoFuture. Your order is being processed.</p>

          <div style="background:#f9f4fb;border-radius:8px;padding:14px 16px;font-size:14px;margin-bottom:24px">
            <strong>Order #${order.orderNumber}</strong>
          </div>

          ${addrHtml}

          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
            <thead>
              <tr style="background:#f9e4ef">
                <th style="padding:10px 8px;text-align:left;font-weight:600;color:#555">Item</th>
                <th style="padding:10px 8px;text-align:center;font-weight:600;color:#555">Qty</th>
                <th style="padding:10px 8px;text-align:right;font-weight:600;color:#555">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:24px">
            ${discount > 0 ? `<tr><td style="padding:5px 8px;color:#666">Discount</td><td style="padding:5px 8px;text-align:right;color:#22c55e">−₹${discount.toLocaleString('en-IN')}</td></tr>` : ''}
            ${tax > 0 ? `<tr><td style="padding:5px 8px;color:#666">GST</td><td style="padding:5px 8px;text-align:right;color:#666">₹${tax.toLocaleString('en-IN')}</td></tr>` : ''}
            <tr><td style="padding:5px 8px;color:#666">Shipping</td><td style="padding:5px 8px;text-align:right;color:#666">${shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</td></tr>
            <tr style="border-top:2px solid #f0e6f0">
              <td style="padding:10px 8px;font-weight:700;font-size:16px">Total Paid</td>
              <td style="padding:10px 8px;text-align:right;font-weight:700;font-size:16px;color:#D4236A">₹${order.total.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          ${invoiceUrl ? `
          <div style="text-align:center;margin:24px 0">
            <a href="${invoiceUrl}" style="display:inline-block;background:#D4236A;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
              View & Download Invoice
            </a>
          </div>` : ''}

          <p style="color:#888;font-size:13px;margin-top:24px">We'll send you another email when your order ships. For support, just reply to this email.</p>
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:20px;font-size:12px;color:#aaa">
          NeoFuture · From trusted hands to quality lives
        </div>
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

export async function sendConsultationConfirmation(
  to: string,
  opts: { patientName: string; doctorName: string; specialisation: string; slotDatetime: string; meetLink: string; fee: number; isFollowup: boolean }
) {
  const dt = new Date(opts.slotDatetime)
  const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${opts.isFollowup ? 'Follow-up' : 'Consultation'} Confirmed — ${dateStr} | NeoFuture`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1A1535">
        <div style="background:#D4236A;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
          <p style="color:#fff;font-size:22px;font-weight:800;margin:0"><span style="color:#ffd6ea">neo</span>future™</p>
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0">Your Wellness Consultation</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #f0e6f0;border-top:none">
          <h2 style="margin:0 0 8px">Consultation Confirmed! 🎉</h2>
          <p style="color:#666;margin:0 0 20px">Hi ${opts.patientName}, your ${opts.isFollowup ? 'free follow-up ' : ''}consultation is booked.</p>
          <div style="background:#f9f4fb;border-radius:10px;padding:16px 20px;margin-bottom:24px">
            <p style="margin:0 0 6px;font-size:14px"><strong>Doctor:</strong> ${opts.doctorName} — ${opts.specialisation}</p>
            <p style="margin:0 0 6px;font-size:14px"><strong>Date:</strong> ${dateStr}</p>
            <p style="margin:0 0 6px;font-size:14px"><strong>Time:</strong> ${timeStr}</p>
            ${opts.isFollowup ? '<p style="margin:0;font-size:14px;color:#22c55e"><strong>Free follow-up consultation</strong></p>' : `<p style="margin:0;font-size:14px"><strong>Fee Paid:</strong> ₹${opts.fee}</p>`}
          </div>
          ${opts.meetLink ? `
          <div style="text-align:center;margin:24px 0">
            <a href="${opts.meetLink}" style="display:inline-block;background:#D4236A;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
              Join Google Meet
            </a>
          </div>
          <p style="color:#888;font-size:12px;text-align:center">Meeting link: <a href="${opts.meetLink}">${opts.meetLink}</a></p>
          ` : ''}
          <p style="color:#888;font-size:13px">Please join 5 minutes before your appointment time. The doctor will start the meeting at the scheduled time.</p>
        </div>
        <div style="text-align:center;padding:20px;font-size:12px;color:#aaa">NeoFuture · From trusted hands to quality lives</div>
      </div>
    `,
  })
}

export async function sendConsultationReport(
  to: string,
  opts: { patientName: string; doctorName: string; pdfBuffer: Buffer }
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Your Prescription from ${opts.doctorName} | NeoFuture`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1535">
        <div style="background:#D4236A;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
          <p style="color:#fff;font-size:20px;font-weight:800;margin:0"><span style="color:#ffd6ea">neo</span>future™</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #f0e6f0;border-top:none">
          <h2>Your Prescription is Ready 📋</h2>
          <p>Hi ${opts.patientName},</p>
          <p>Your consultation with <strong>${opts.doctorName}</strong> is complete. Please find your prescription attached to this email.</p>
          <p style="color:#888;font-size:13px">You can also download it anytime from your NeoFuture account under My Appointments.</p>
          <div style="background:#fff3f4;border-left:4px solid #D4236A;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;font-size:13px;color:#6b7280">
            This is an electronic prescription issued based on teleconsultation. Not valid for medico-legal purposes.
          </div>
        </div>
        <div style="text-align:center;padding:20px;font-size:12px;color:#aaa">NeoFuture · From trusted hands to quality lives</div>
      </div>
    `,
    attachments: [{ filename: 'prescription.pdf', content: opts.pdfBuffer, contentType: 'application/pdf' }],
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
