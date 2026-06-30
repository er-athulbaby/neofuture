import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryOne, query } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { getSiteConfig } from '@/lib/settings'
import PrintButton from './PrintButton'

interface Props { params: Promise<{ id: string }> }

interface OrderRow {
  id: number; order_number: string; status: string; payment_status: string
  subtotal: number; discount: number; shipping: number; tax: number | null; total: number
  created_at: string; shipping_address: string; user_id: string | null
}

interface ItemRow {
  product_name: string; quantity: number; price: number; total: number
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const [order, config] = await Promise.all([
    queryOne<OrderRow>(`SELECT * FROM orders WHERE id = $1`, [parseInt(id)]).catch(() => null),
    getSiteConfig(),
  ])

  if (!order) notFound()
  if (order.user_id && order.user_id !== session?.user?.id && !session?.user?.is_admin) notFound()

  const items = await query<ItemRow>(
    `SELECT product_name, quantity, price, total FROM order_items WHERE order_id = $1 ORDER BY id`,
    [order.id]
  ).catch(() => [])

  const addr = (() => { try { return JSON.parse(order.shipping_address) } catch { return null } })()
  const tax = order.tax ?? 0

  return (
    <>
      {/* Print-specific global styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; }
        }
      `}} />

      {/* Action bar — hidden when printing */}
      <div className="no-print bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-brand-gray">Invoice #{order.order_number}</p>
        <PrintButton />
      </div>

      {/* Invoice body */}
      <div className="max-w-3xl mx-auto px-8 py-10 bg-white min-h-screen">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.site_name} className="h-12 object-contain mb-2" />
            ) : (
              <p className="text-2xl font-bold" style={{ color: config.color_primary }}>
                <span style={{ color: config.color_neo_orange }}>neo</span>future™
              </p>
            )}
            {config.address && (
              <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{config.address}</p>
            )}
            {config.contact_email && (
              <p className="text-xs text-gray-500">{config.contact_email}</p>
            )}
            {config.contact_phone && (
              <p className="text-xs text-gray-500">{config.contact_phone}</p>
            )}
          </div>

          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
            <table className="text-sm text-gray-600 mt-2 ml-auto">
              <tbody>
                <tr>
                  <td className="pr-4 font-medium text-gray-400 uppercase text-xs">Invoice No</td>
                  <td className="font-semibold text-gray-800">#{order.order_number}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium text-gray-400 uppercase text-xs">Date</td>
                  <td className="text-gray-700">{formatDate(order.created_at)}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium text-gray-400 uppercase text-xs">Status</td>
                  <td className="capitalize font-medium text-gray-800">{order.status}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium text-gray-400 uppercase text-xs">Payment</td>
                  <td className="capitalize text-gray-700">{order.payment_status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 mb-8" />

        {/* Bill To */}
        {addr && (
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill / Ship To</p>
            <p className="font-semibold text-gray-800">{addr.name}</p>
            <p className="text-sm text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
            <p className="text-sm text-gray-600">{addr.city}, {addr.state} – {addr.pincode}</p>
            {addr.phone && <p className="text-sm text-gray-600">Phone: {addr.phone}</p>}
            {addr.email && <p className="text-sm text-gray-600">Email: {addr.email}</p>}
          </div>
        )}

        {/* Items table */}
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr style={{ backgroundColor: config.color_primary, color: '#fff' }}>
              <th className="text-left py-3 px-4 font-semibold rounded-tl-lg">#</th>
              <th className="text-left py-3 px-4 font-semibold">Item</th>
              <th className="text-right py-3 px-4 font-semibold">Qty</th>
              <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
              <th className="text-right py-3 px-4 font-semibold rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                <td className="py-3 px-4 text-gray-800 font-medium">{item.product_name}</td>
                <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 px-4 text-right text-gray-600">{formatPrice(item.price)}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-800">{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span><span>−{formatPrice(order.discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>GST</span><span>{formatPrice(tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t-2 border-gray-200 pt-3 mt-1">
              <span>Total Paid</span>
              <span style={{ color: config.color_primary }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-sm text-gray-500">{config.tagline}</p>
          {config.whatsapp_number && (
            <p className="text-xs text-gray-400 mt-1">WhatsApp: +{config.whatsapp_number}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            This is a computer-generated invoice and does not require a physical signature.
          </p>
        </div>
      </div>
    </>
  )
}
