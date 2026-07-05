'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/components/cart/CartProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { formatPrice } from '@/lib/utils'
import { Lock, ChevronLeft, ChevronRight, MapPin, CreditCard, Truck, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import type { ShippingAddress } from '@/types'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { items, subtotal, clearCart } = useCart()
  const { toast } = useToast()

  const couponCode = searchParams.get('coupon') ?? ''
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [codEnabled, setCodEnabled] = useState(false)
  const [gstRate, setGstRate] = useState(0)
  const [pincodeLoading, setPincodeLoading] = useState(false)

  const [address, setAddress] = useState<ShippingAddress>({
    name: session?.user?.name ?? '',
    phone: '',
    email: session?.user?.email ?? '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  })

  const [npBalance, setNpBalance] = useState(0)
  const [npToRedeem, setNpToRedeem] = useState(0)
  const npDiscount = Math.round(subtotal * (npToRedeem / 100) / 100)

  const [gstType, setGstType] = useState<'inclusive' | 'exclusive'>('inclusive')
  const [pricing, setPricing] = useState<{
    subtotal: number; discount: number; shipping: number; tax: number; total: number;
    razorpay_order_id: string; coupon_id: number | null; key_id: string
    gst_rate: number; gst_type: string
  } | null>(null)

  const shipping = subtotal >= 999 ? 0 : 50
  // Inclusive: GST is part of the price (show breakdown only)
  // Exclusive: GST added on top (changes the displayed total)
  const gstAmount = gstRate > 0
    ? gstType === 'exclusive'
      ? Math.round(subtotal * gstRate / 100)
      : Math.round((subtotal * gstRate) / (100 + gstRate))
    : 0
  const displayTotal = gstType === 'exclusive'
    ? subtotal + gstAmount + shipping - npDiscount
    : subtotal + shipping - npDiscount

  useEffect(() => {
    if (session?.user?.name) setAddress((a) => ({ ...a, name: session.user.name! }))
    if (session?.user?.email) setAddress((a) => ({ ...a, email: session.user.email! }))
  }, [session])

  // Fetch public settings (COD + GST)
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.cod_enabled) { setCodEnabled(true); setPaymentMethod('cod') }
        if (d.gst_rate > 0) setGstRate(d.gst_rate)
        if (d.gst_type) setGstType(d.gst_type)
      })
      .catch(() => {})
  }, [])

  // Fetch NP balance for logged-in users
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/neopulse/balance')
      .then((r) => r.json())
      .then((d) => setNpBalance(d.balance ?? 0))
      .catch(() => {})
  }, [session])

  // Save cart as abandoned cart candidate on mount (non-fatal)
  useEffect(() => {
    if (!items.length) return
    const email = session?.user?.email ?? address.email
    fetch('/api/cart/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, email, subtotal }),
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount

  // Pincode autocomplete via India Post free API
  const lookupPincode = useCallback(async (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return
    setPincodeLoading(true)
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
      const data = await res.json()
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0]
        setAddress((a) => ({
          ...a,
          city: a.city || po.District || po.Name,
          state: a.state || po.State,
        }))
      }
    } catch {}
    finally { setPincodeLoading(false) }
  }, [])

  const fieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setAddress((a) => ({ ...a, [name]: value }))
    if (name === 'pincode' && value.length === 6) lookupPincode(value)
  }

  async function proceedToPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!items.length) { toast('Your cart is empty', 'error'); return }
    const required: (keyof ShippingAddress)[] = ['name', 'phone', 'line1', 'city', 'state', 'pincode']
    for (const f of required) {
      if (!address[f]?.trim()) { toast(`Please fill in ${f.replace('_', ' ')}`, 'error'); return }
    }
    if (!/^\d{6}$/.test(address.pincode)) { toast('Enter a valid 6-digit pincode', 'error'); return }
    if (!/^\d{10}$/.test(address.phone)) { toast('Enter a valid 10-digit phone number', 'error'); return }

    // Update abandoned cart with email once user fills it in
    const email = address.email ?? session?.user?.email
    if (email) {
      fetch('/api/cart/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, email, subtotal }),
      }).catch(() => {})
    }

    setLoading(true)

    if (paymentMethod === 'cod') {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress: address, couponCode, payment_method: 'cod', neopulse_points: npToRedeem }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) { toast(data.error || 'Failed to place order', 'error'); return }
      // Mark abandoned cart as converted
      fetch('/api/cart/save', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }) }).catch(() => {})
      clearCart()
      router.push(`/order/${data.order_id}`)
      return
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, shippingAddress: address, couponCode, payment_method: 'razorpay', neopulse_points: npToRedeem }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast(data.error || 'Failed to create order', 'error'); return }
    setPricing(data)
    setStep(2)
  }

  async function initiatePayment() {
    if (!pricing) return

    if (!window.Razorpay) {
      await new Promise<void>((resolve) => {
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve()
        document.head.appendChild(s)
      })
    }

    const rzp = new window.Razorpay({
      key: pricing.key_id,
      order_id: pricing.razorpay_order_id,
      amount: Math.round(pricing.total * 100),
      currency: 'INR',
      name: 'NeoFuture',
      description: `Order for ${items.length} item(s)`,
      prefill: { name: address.name, email: address.email, contact: `+91${address.phone}` },
      theme: { color: '#D4236A' },
      handler: async (response: Record<string, string>) => {
        setLoading(true)
        const verify = await fetch('/api/checkout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...response,
            items,
            shippingAddress: address,
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            shipping: pricing.shipping,
            tax: pricing.tax,
            total: pricing.total,
            couponId: pricing.coupon_id,
          }),
        })
        const vData = await verify.json()
        setLoading(false)
        if (!verify.ok) { toast(vData.error || 'Payment verification failed', 'error'); return }
        // Mark abandoned cart as converted
        fetch('/api/cart/save', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: address.email }) }).catch(() => {})
        clearCart()
        router.push(`/order/${vData.order_id}`)
      },
    })
    rzp.open()
  }

  if (!items.length) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-brand-gray mb-4">Your cart is empty.</p>
        <Link href="/shop" className="text-primary hover:underline">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {['Shipping Details', 'Payment'].map((label, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${i + 1 === step ? 'bg-primary text-white' : i + 1 < step ? 'bg-success text-white' : 'bg-gray-100 text-brand-gray'}`}>
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold border-current">
                {i + 1 < step ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i === 0 && <ChevronRight size={16} className="text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <form onSubmit={proceedToPayment} className="space-y-5">
              {/* Address */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-brand-dark text-lg mb-5 flex items-center gap-2">
                  <MapPin size={20} className="text-primary" /> Shipping Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" name="name" value={address.name} onChange={fieldChange} required />
                  <Field label="Phone Number" name="phone" value={address.phone} onChange={fieldChange} required placeholder="10-digit mobile" />
                  <div className="sm:col-span-2">
                    <Field label="Email" name="email" type="email" value={address.email ?? ''} onChange={fieldChange} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Address Line 1" name="line1" value={address.line1} onChange={fieldChange} required placeholder="House / Flat / Block No." />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Address Line 2 (optional)" name="line2" value={address.line2 ?? ''} onChange={fieldChange} placeholder="Street / Locality" />
                  </div>

                  {/* Pincode with autocomplete spinner */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-brand-dark mb-1.5">
                      Pincode<span className="text-danger ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pincode"
                        value={address.pincode}
                        onChange={fieldChange}
                        required
                        maxLength={6}
                        placeholder="6-digit PIN"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors pr-9"
                      />
                      {pincodeLoading && (
                        <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                      )}
                    </div>
                    {address.pincode.length === 6 && !pincodeLoading && address.city && (
                      <p className="text-xs text-success mt-1">✓ Location found</p>
                    )}
                  </div>

                  <Field label="City" name="city" value={address.city} onChange={fieldChange} required />
                  <Field label="State" name="state" value={address.state} onChange={fieldChange} required />
                  <Field label="Country" name="country" value={address.country ?? 'India'} onChange={fieldChange} disabled />
                </div>
              </div>

              {/* NeoPulse redemption */}
              {session?.user && npBalance >= 100 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="font-bold text-brand-dark text-lg mb-3 flex items-center gap-2">
                    <Zap size={20} className="text-primary" /> Use NeoPulse Points
                  </h2>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-brand-gray">Your balance: <span className="font-bold text-primary">{npBalance} NP</span></p>
                    <p className="text-xs text-brand-gray">100 NP = 1% off</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[0, 100, 200, 300, 500].filter((v) => v <= npBalance).map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setNpToRedeem(pts)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          npToRedeem === pts
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-200 text-brand-gray hover:border-primary hover:text-primary'
                        }`}
                      >
                        {pts === 0 ? 'None' : `${pts} NP (${pts / 100}% off)`}
                      </button>
                    ))}
                  </div>
                  {npToRedeem > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Saving {formatPrice(npDiscount)} with {npToRedeem} NP
                    </p>
                  )}
                </div>
              )}

              {/* Payment method selector */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-brand-dark text-lg mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" /> Payment Method
                </h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMethod" value="razorpay"
                      checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')}
                      className="accent-primary w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-semibold text-brand-dark text-sm">Pay Online</p>
                      <p className="text-xs text-brand-gray mt-0.5">UPI, Credit / Debit Card, Net Banking via Razorpay</p>
                    </div>
                    <Lock size={16} className="text-primary" />
                  </label>

                  {codEnabled && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="paymentMethod" value="cod"
                        checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')}
                        className="accent-primary w-4 h-4" />
                      <div className="flex-1">
                        <p className="font-semibold text-brand-dark text-sm">Cash on Delivery (COD)</p>
                        <p className="text-xs text-brand-gray mt-0.5">Pay in cash when your order arrives</p>
                      </div>
                      <Truck size={16} className="text-green-600" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/cart"
                  className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-brand-gray hover:border-gray-300 transition-colors">
                  <ChevronLeft size={16} /> Back to Cart
                </Link>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors">
                  {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Continue to Payment'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {step === 2 && pricing && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-brand-dark text-lg mb-5 flex items-center gap-2">
                <CreditCard size={20} className="text-primary" /> Payment
              </h2>

              <div className="bg-brand-light rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">Delivering to</p>
                <p className="text-sm text-brand-dark font-medium">{address.name}</p>
                <p className="text-sm text-brand-gray">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p className="text-sm text-brand-gray">{address.city}, {address.state} – {address.pincode}</p>
                <p className="text-sm text-brand-gray">{address.phone}</p>
                <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline mt-1">Change</button>
              </div>

              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between text-brand-gray">
                  <span>Subtotal</span><span>{formatPrice(pricing.subtotal)}</span>
                </div>
                {(pricing.gst_rate ?? gstRate) > 0 && (
                  <div className="flex justify-between text-brand-gray text-xs">
                    <span>{(pricing.gst_type ?? gstType) === 'exclusive' ? `GST (${pricing.gst_rate ?? gstRate}%)` : `GST Incl. (${pricing.gst_rate ?? gstRate}%)`}</span>
                    <span>{(pricing.gst_type ?? gstType) === 'exclusive' ? '+' : ''}{formatPrice(pricing.tax ?? 0)}</span>
                  </div>
                )}
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Coupon Discount</span><span>−{formatPrice(pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-gray">
                  <span>Shipping</span>
                  <span className={pricing.shipping === 0 ? 'text-success font-medium' : ''}>
                    {pricing.shipping === 0 ? 'Free' : formatPrice(pricing.shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-brand-dark text-base pt-2 border-t border-gray-100">
                  <span>Total to Pay</span><span>{formatPrice(pricing.total)}</span>
                </div>
              </div>

              <button onClick={initiatePayment} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-lg shadow-primary/20 text-base">
                <Lock size={18} />
                {loading ? 'Processing...' : `Pay ${formatPrice(pricing.total)} Securely`}
              </button>

              <p className="text-center text-xs text-brand-gray mt-4">
                🔒 Your payment is secured by Razorpay. UPI, Cards, Net Banking accepted.
              </p>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <h3 className="font-bold text-brand-dark mb-4">Order Summary ({items.length} items)</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.product_id}_${item.variant_id ?? ''}`} className="flex justify-between text-sm">
                  <div className="flex-1 mr-2 min-w-0">
                    <p className="text-brand-gray line-clamp-1">{item.name} × {item.quantity}</p>
                    {item.variant_label && <p className="text-xs text-brand-gray/70">{item.variant_label}</p>}
                  </div>
                  <span className="font-medium text-brand-dark flex-shrink-0">{formatPrice((item.sale_price ?? item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-brand-dark">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {gstRate > 0 && (
                <div className="flex justify-between text-brand-gray text-xs">
                  <span>{gstType === 'exclusive' ? `GST (${gstRate}%)` : `GST Incl. (${gstRate}%)`}</span>
                  <span>{gstType === 'exclusive' ? '+' : ''}{formatPrice(gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-gray">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-success' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && subtotal > 0 && (
                <p className="text-xs text-brand-gray bg-brand-light rounded-lg px-3 py-2">
                  Add {formatPrice(999 - subtotal)} more for free shipping
                </p>
              )}
              {npDiscount > 0 && (
                <div className="flex justify-between text-primary text-sm font-medium">
                  <span className="flex items-center gap-1"><Zap size={12} /> NeoPulse ({npToRedeem} NP)</span>
                  <span>−{formatPrice(npDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-brand-dark border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>{formatPrice(displayTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, name, value, onChange, required, placeholder, type = 'text', disabled
}: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} disabled={disabled} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-brand-gray transition-colors"
      />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-brand-gray">Loading...</div>}>
      <CheckoutForm />
    </Suspense>
  )
}
