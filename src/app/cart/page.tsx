'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/components/cart/CartProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Trash2, Tag, ChevronRight, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const { items, updateItem, removeItem, subtotal, clearCart } = useCart()
  const { toast } = useToast()
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; type: string; value: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const discount = coupon
    ? coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal)
    : 0

  const shipping = subtotal >= 999 ? 0 : 50
  const total = subtotal - discount + shipping

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, subtotal }),
    })
    const data = await res.json()
    setCouponLoading(false)
    if (!res.ok) { setCouponError(data.error); return }
    setCoupon(data.coupon)
    toast(`Coupon "${data.coupon.code}" applied! You save ${formatPrice(data.discount)}`)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingCart size={56} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Your cart is empty</h1>
        <p className="text-brand-gray mb-8">Add some products to get started!</p>
        <Link href="/shop" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
          <ArrowLeft size={18} /> Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-brand-dark mb-6 flex items-center gap-2">
        <ShoppingCart size={24} className="text-primary" />
        My Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.product_id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
              {/* Image */}
              <div className="relative w-20 h-20 bg-brand-light rounded-xl flex-shrink-0 overflow-hidden">
                <Image src={item.image || '/images/placeholder.png'} alt={item.name} fill className="object-contain p-2" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`}
                  className="font-semibold text-brand-dark hover:text-primary transition-colors line-clamp-2">
                  {item.name}
                </Link>

                <div className="flex items-center justify-between mt-2">
                  {/* Qty control */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateItem(item.product_id, item.quantity - 1)}
                      className="px-2.5 py-1.5 hover:bg-gray-50 text-brand-dark font-bold transition-colors">−</button>
                    <span className="px-3 text-sm font-semibold text-brand-dark">{item.quantity}</span>
                    <button onClick={() => updateItem(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="px-2.5 py-1.5 hover:bg-gray-50 text-brand-dark font-bold transition-colors disabled:opacity-40">+</button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-brand-dark">{formatPrice((item.sale_price ?? item.price) * item.quantity)}</p>
                    {item.sale_price && item.sale_price < item.price && (
                      <p className="text-xs text-brand-gray line-through">{formatPrice(item.price * item.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove */}
              <button onClick={() => { removeItem(item.product_id); toast(`${item.name} removed`) }}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="flex justify-between pt-2">
            <Link href="/shop" className="flex items-center gap-1.5 text-sm text-brand-gray hover:text-primary transition-colors">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
            <button onClick={() => { clearCart(); toast('Cart cleared') }}
              className="text-sm text-danger hover:underline">
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-bold text-brand-dark text-lg mb-5">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-brand-dark mb-2">
                <Tag size={14} className="inline mr-1.5 text-primary" />
                Have a coupon?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); setCoupon(null) }}
                  placeholder="Enter code"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary uppercase"
                />
                <button onClick={applyCoupon} disabled={couponLoading || !couponCode}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs text-danger mt-1.5">{couponError}</p>}
              {coupon && <p className="text-xs text-success mt-1.5">✓ Coupon applied successfully!</p>}
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-brand-gray">
                <span>Subtotal</span>
                <span className="text-brand-dark">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount ({coupon?.code})</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-gray">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-success font-medium' : 'text-brand-dark'}>
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-brand-gray bg-neo-orange-light rounded-lg px-3 py-2">
                  Add {formatPrice(999 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="flex justify-between font-bold text-brand-dark text-base pt-3 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link
              href={`/checkout${coupon ? `?coupon=${coupon.code}` : ''}`}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
              Proceed to Checkout
              <ChevronRight size={18} />
            </Link>

            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-brand-gray">
              <span>🔒 Secure checkout</span>
              <span>•</span>
              <span>Razorpay secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
