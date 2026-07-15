'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCart } from '@/components/cart/CartProvider'
import { useToast } from '@/components/ui/ToastProvider'
import ProductCard from '@/components/products/ProductCard'
import type { Product, Review, ProductVariant, SubscriptionPlan } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { ShoppingCart, Heart, Star, Check, Package, Truck, RefreshCw, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  product: Product
  reviews: Review[]
  related: Product[]
  variants: ProductVariant[]
}

export default function ProductDetailClient({ product, reviews, related, variants }: Props) {
  const { data: session } = useSession()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [activeImage, setActiveImage] = useState(0)
  const minQty = product.min_order_qty ?? 1
  const [qty, setQty] = useState(minQty)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  )

  // Subscription state
  const [purchaseMode, setPurchaseMode] = useState<'one-time' | 'subscribe'>('one-time')
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    fetch(`/api/products/${product.id}/subscription-plans`)
      .then((r) => r.json())
      .then((d) => {
        if (d.plans?.length) {
          setPlans(d.plans)
          setSelectedPlan(d.plans[0])
        }
      })
      .catch(() => {})
  }, [product.id])

  // Track recently viewed in localStorage
  useEffect(() => {
    try {
      const key = 'nf_recently_viewed'
      const stored: number[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      const updated = [product.id, ...stored.filter((id) => id !== product.id)].slice(0, 10)
      localStorage.setItem(key, JSON.stringify(updated))
    } catch {}
  }, [product.id])
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'how_to_use' | 'reviews'>('description')
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  const images = product.images?.length ? product.images : ['/images/placeholder.png']

  // When variant selected, use its price/stock; fall back to product
  const effectivePrice = selectedVariant?.price ?? product.price
  const effectiveSalePrice = selectedVariant !== null
    ? (selectedVariant.sale_price ?? (selectedVariant.price !== null ? null : product.sale_price))
    : product.sale_price
  const effectiveStock = selectedVariant !== null ? selectedVariant.stock : product.stock

  const subscribePrice = purchaseMode === 'subscribe' && selectedPlan ? selectedPlan.price : null
  const displayPrice = subscribePrice ?? (effectiveSalePrice ?? effectivePrice)
  const displayOriginalPrice = subscribePrice ? (effectiveSalePrice ?? effectivePrice) : effectivePrice
  const hasDiscount = displayPrice < displayOriginalPrice
  const discountPct = hasDiscount ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : 0

  function handleAddToCart() {
    if (effectiveStock <= 0) return
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image: images[0],
      price: effectivePrice,
      sale_price: subscribePrice ?? effectiveSalePrice ?? undefined,
      quantity: qty,
      stock: effectiveStock,
      variant_id: selectedVariant?.id,
      variant_label: selectedVariant?.label,
      subscription_plan_id: purchaseMode === 'subscribe' ? selectedPlan?.id : undefined,
      subscription_months: purchaseMode === 'subscribe' ? selectedPlan?.duration_months : undefined,
      subscription_label: purchaseMode === 'subscribe' ? selectedPlan?.label : undefined,
    })
    const sub = purchaseMode === 'subscribe' && selectedPlan ? ` — ${selectedPlan.label}` : ''
    toast(`${product.name}${selectedVariant ? ` (${selectedVariant.label})` : ''}${sub} added to cart!`)
  }

  async function toggleWishlist() {
    if (!session?.user?.id) { toast('Sign in to save to wishlist', 'info'); return }
    if (wishlisted) {
      await fetch('/api/wishlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: product.id }) })
      setWishlisted(false)
      toast('Removed from wishlist')
    } else {
      await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: product.id }) })
      setWishlisted(true)
      toast('Added to wishlist!')
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user?.id) { toast('Sign in to leave a review', 'info'); return }
    if (!reviewForm.rating) { toast('Please select a rating', 'error'); return }
    setSubmittingReview(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, rating: reviewForm.rating, comment: reviewForm.comment }),
    })
    setSubmittingReview(false)
    if (res.ok) {
      toast('Review submitted!')
      setReviewForm({ rating: 0, comment: '' })
    } else {
      toast('Failed to submit review', 'error')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-brand-gray mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <Link href={`/shop/${product.category_slug}`} className="hover:text-primary">{product.category_name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-brand-dark truncate max-w-48">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Image gallery */}
        <div>
          <div className="relative h-96 bg-brand-light rounded-2xl overflow-hidden mb-3">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain p-6"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg">
                {discountPct}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={cn('flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden bg-brand-light transition-all',
                    activeImage === i ? 'border-primary' : 'border-gray-200')}>
                  <img src={img} alt="" className="object-contain p-1 w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.category_name && (
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">{product.category_name}</span>
          )}
          <h1 className="text-3xl font-bold text-brand-dark mt-1 mb-2">{product.name}</h1>

          {product.flavor && (
            <p className="text-sm text-brand-gray mb-3">Flavor: <span className="font-medium text-brand-dark">{product.flavor}</span></p>
          )}

          {/* Rating */}
          {Number(product.avg_rating) > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={16} className={cn(s <= Math.round(Number(product.avg_rating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />
                ))}
              </div>
              <span className="text-sm text-brand-gray">{Number(product.avg_rating).toFixed(1)} ({product.review_count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-bold text-brand-dark">{formatPrice(displayPrice)}</span>
            {hasDiscount && <span className="text-lg text-brand-gray line-through">{formatPrice(displayOriginalPrice)}</span>}
            {hasDiscount && <span className="text-sm font-semibold text-success">Save {formatPrice(displayOriginalPrice - displayPrice)}</span>}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="text-brand-gray leading-relaxed mb-5">{product.short_description}</p>
          )}

          {/* Pack info */}
          {(product.pack_format || product.serving_size || minQty > 1) && (
            <div className="flex flex-wrap gap-3 mb-5">
              {product.pack_format && (
                <span className="inline-flex items-center gap-1.5 text-sm bg-primary-light text-primary px-3 py-1.5 rounded-full font-medium">
                  <Package size={13} />
                  {product.pack_format}
                </span>
              )}
              {product.serving_size && (
                <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-brand-dark px-3 py-1.5 rounded-full font-medium">
                  {product.serving_size}
                </span>
              )}
              {minQty > 1 && (
                <span className="inline-flex items-center gap-1.5 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium">
                  Min. order: {minQty}
                </span>
              )}
            </div>
          )}

          {/* Variant selector */}
          {variants.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-brand-dark mb-2">
                Select Variant: <span className="font-normal text-brand-gray">{selectedVariant?.label}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariant(v); setQty(1) }}
                    disabled={v.stock <= 0}
                    className={cn(
                      'px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all',
                      selectedVariant?.id === v.id
                        ? 'border-primary bg-primary text-white'
                        : v.stock <= 0
                          ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                          : 'border-gray-200 text-brand-dark hover:border-primary hover:text-primary'
                    )}
                  >
                    {v.label}
                    {v.stock <= 0 && ' (sold out)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subscribe & Save */}
          {plans.length > 0 && (
            <div className="mb-5 border-2 border-gray-100 rounded-2xl overflow-hidden">
              {/* Toggle */}
              <div className="grid grid-cols-2">
                <button
                  onClick={() => setPurchaseMode('one-time')}
                  className={cn(
                    'py-3 text-sm font-semibold transition-colors',
                    purchaseMode === 'one-time'
                      ? 'bg-brand-dark text-white'
                      : 'bg-gray-50 text-brand-gray hover:bg-gray-100'
                  )}
                >
                  One-time Purchase
                </button>
                <button
                  onClick={() => setPurchaseMode('subscribe')}
                  className={cn(
                    'py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5',
                    purchaseMode === 'subscribe'
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-brand-gray hover:bg-gray-100'
                  )}
                >
                  <RotateCcw size={14} /> Subscribe & Save
                </button>
              </div>

              {/* Plan selector */}
              {purchaseMode === 'subscribe' && (
                <div className="p-4 bg-primary/5 border-t border-primary/10">
                  <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-3">Choose your plan</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          'flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center',
                          selectedPlan?.id === plan.id
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 bg-white hover:border-primary text-brand-dark'
                        )}
                      >
                        <span className="font-bold text-sm">{plan.label}</span>
                        <span className={cn('text-xs mt-1', selectedPlan?.id === plan.id ? 'text-white/80' : 'text-brand-gray')}>
                          {formatPrice(plan.price)}
                        </span>
                        {(effectiveSalePrice ?? effectivePrice) > plan.price && (
                          <span className={cn('text-xs font-semibold mt-1', selectedPlan?.id === plan.id ? 'text-white' : 'text-success')}>
                            Save {Math.round(((effectiveSalePrice ?? effectivePrice) - plan.price) / (effectiveSalePrice ?? effectivePrice) * 100)}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-brand-gray mt-3 flex items-center gap-1">
                    <Check size={12} className="text-success" />
                    One-time payment · No auto-renewal · Cancel anytime
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            {effectiveStock > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-success font-medium">
                  {effectiveStock <= 10 ? `Only ${effectiveStock} left!` : 'In Stock'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-sm text-danger font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Qty + Add to cart */}
          {effectiveStock > 0 && (
            <div className="flex gap-3 mb-4">
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(minQty, qty - 1))}
                  className="px-3 py-3 hover:bg-gray-50 text-brand-dark font-bold text-lg transition-colors">−</button>
                <span className="px-4 font-semibold text-brand-dark min-w-10 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(effectiveStock, qty + 1))}
                  className="px-3 py-3 hover:bg-gray-50 text-brand-dark font-bold text-lg transition-colors">+</button>
              </div>
              <button onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              <button onClick={toggleWishlist}
                className={cn('p-3 rounded-xl border-2 transition-colors', wishlisted ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary text-brand-gray hover:text-primary')}>
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          )}

          <Link href="/cart"
            className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary py-3 rounded-xl font-semibold hover:bg-primary-light transition-colors mb-5">
            Buy Now
          </Link>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
            <TrustBadge icon={<Package size={18} />} label="Secure Packaging" />
            <TrustBadge icon={<Truck size={18} />} label="Fast Delivery" />
            <TrustBadge icon={<RefreshCw size={18} />} label="Easy Returns" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {[
            { key: 'description', label: 'Description' },
            { key: 'ingredients', label: 'Ingredients' },
            { key: 'how_to_use', label: 'How to Use' },
            { key: 'reviews', label: `Reviews (${product.review_count ?? 0})` },
          ].map((tab) => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn('px-5 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors',
                activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-brand-gray hover:text-brand-dark')}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none text-brand-dark leading-relaxed whitespace-pre-wrap">
            {product.description ?? 'No description available.'}
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="text-brand-dark leading-relaxed whitespace-pre-wrap">
            {product.ingredients ?? 'Ingredient information not available.'}
          </div>
        )}

        {activeTab === 'how_to_use' && (
          <div className="text-brand-dark leading-relaxed whitespace-pre-wrap">
            {product.how_to_use ?? 'Usage instructions not available.'}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Review form */}
            {session?.user && (
              <div className="bg-brand-light rounded-2xl p-5">
                <h3 className="font-semibold text-brand-dark mb-4">Write a Review</h3>
                <form onSubmit={submitReview} className="space-y-3">
                  <div>
                    <p className="text-sm text-brand-gray mb-2">Your Rating</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}>
                          <Star size={28} className={cn(s <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300')} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                  <button type="submit" disabled={submittingReview || !reviewForm.rating}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-brand-dark">{review.user_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={13} className={cn(s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />
                            ))}
                          </div>
                          {review.is_verified_purchase && (
                            <span className="flex items-center gap-1 text-xs text-success">
                              <Check size={11} /> Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-brand-gray">{formatDate(review.created_at)}</span>
                    </div>
                    {review.comment && <p className="text-sm text-brand-dark mt-2 leading-relaxed">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-brand-gray">
                <Star size={32} className="mx-auto opacity-30 mb-3" />
                <p>No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-brand-dark mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center">{icon}</div>
      <span className="text-xs text-brand-gray font-medium">{label}</span>
    </div>
  )
}
