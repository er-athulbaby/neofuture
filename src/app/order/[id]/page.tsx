import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryOne, query } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { CheckCircle2, Truck, MapPin, Clock, FileText } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

interface OrderRow {
  id: number; order_number: string; status: string; payment_status: string
  subtotal: number; discount: number; shipping: number; tax: number | null; total: number
  created_at: string; shipping_address: string; tracking_number: string | null
  notes: string | null; user_id: string | null
}

interface ItemRow {
  product_name: string; product_image: string | null; quantity: number; price: number; total: number
}

const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered']
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered'
}
const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-blue-500', processing: 'text-neo-orange', shipped: 'text-neo-purple',
  delivered: 'text-success', cancelled: 'text-danger'
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const order = await queryOne<OrderRow>(
    `SELECT * FROM orders WHERE id = $1`,
    [parseInt(id)]
  ).catch(() => null)

  if (!order) notFound()
  if (order.user_id && order.user_id !== session?.user?.id && !session?.user?.is_admin) notFound()

  const items = await query<ItemRow>(
    `SELECT product_name, product_image, quantity, price, total FROM order_items WHERE order_id = $1`,
    [order.id]
  ).catch(() => [])

  const addr = (() => {
    try { return JSON.parse(order.shipping_address) } catch { return null }
  })()

  const stepIdx = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Success banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-4">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-bold text-brand-dark">Order Placed!</h1>
        <p className="text-brand-gray mt-1">
          Thank you! Your order <span className="font-semibold text-brand-dark">#{order.order_number}</span> has been confirmed.
        </p>
        {session?.user?.email && (
          <p className="text-sm text-brand-gray mt-1">A confirmation email has been sent to {session.user.email}</p>
        )}
      </div>

      {/* Status tracker */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-brand-dark mb-4 text-sm uppercase tracking-wide">Order Status</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                    ${i <= stepIdx ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium text-center ${i <= stepIdx ? 'text-primary' : 'text-brand-gray'}`}>
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${i < stepIdx ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          {order.tracking_number && (
            <p className="text-sm text-brand-gray mt-4 bg-brand-light rounded-lg px-3 py-2">
              <Truck size={14} className="inline mr-1.5" />
              Tracking number: <span className="font-mono font-semibold text-brand-dark">{order.tracking_number}</span>
            </p>
          )}
          {order.notes && (
            <p className="text-sm text-brand-gray mt-2 bg-brand-light rounded-lg px-3 py-2">
              <Clock size={14} className="inline mr-1.5" /> {order.notes}
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h2 className="font-semibold text-brand-dark mb-4">Items Ordered</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-brand-dark text-sm">{item.product_name}</p>
                <p className="text-xs text-brand-gray">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <p className="font-semibold text-brand-dark">{formatPrice(item.total)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-brand-gray">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span><span>−{formatPrice(order.discount)}</span>
            </div>
          )}
          {(order.tax ?? 0) > 0 && (
            <div className="flex justify-between text-brand-gray">
              <span>GST</span><span>{formatPrice(order.tax!)}</span>
            </div>
          )}
          <div className="flex justify-between text-brand-gray">
            <span>Shipping</span>
            <span className={order.shipping === 0 ? 'text-success' : ''}>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-bold text-brand-dark text-base pt-2 border-t border-gray-100">
            <span>Total Paid</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      {addr && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-brand-dark mb-3 flex items-center gap-1.5">
            <MapPin size={16} className="text-primary" /> Shipping Address
          </h2>
          <p className="text-sm text-brand-dark font-medium">{addr.name}</p>
          <p className="text-sm text-brand-gray">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
          <p className="text-sm text-brand-gray">{addr.city}, {addr.state} – {addr.pincode}</p>
          <p className="text-sm text-brand-gray">{addr.phone}</p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link href="/shop"
          className="flex-1 text-center bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
          Continue Shopping
        </Link>
        {session?.user && (
          <Link href="/account/orders"
            className="flex-1 text-center border-2 border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary-light transition-colors">
            View All Orders
          </Link>
        )}
        <Link href={`/order/${id}/invoice`}
          className="flex items-center justify-center gap-2 w-full border-2 border-gray-200 text-brand-gray px-6 py-3 rounded-xl font-semibold hover:border-primary hover:text-primary transition-colors text-sm">
          <FileText size={16} /> Download Invoice
        </Link>
      </div>
    </div>
  )
}
