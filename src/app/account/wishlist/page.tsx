'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import type { Product } from '@/types'
import { Heart } from 'lucide-react'

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/wishlist')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/wishlist')
        .then((r) => r.json())
        .then((d) => setProducts(d.items ?? []))
        .finally(() => setLoading(false))
    }
  }, [status, router])

  async function removeFromWishlist(productId: number) {
    await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    })
    setProducts((pp) => pp.filter((p) => p.id !== productId))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map((i) => <div key={i} className="h-80 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={24} className="text-primary" fill="currentColor" />
        <h1 className="text-2xl font-bold text-brand-dark">My Wishlist</h1>
        {products.length > 0 && (
          <span className="text-sm text-brand-gray">({products.length} items)</span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-lg font-semibold text-brand-dark mb-2">Your wishlist is empty</h2>
          <p className="text-brand-gray text-sm mb-6">Save products you love and come back to them anytime.</p>
          <Link href="/shop"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  title="Remove from wishlist"
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-primary hover:bg-red-50 transition-colors z-10"
                >
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/shop" className="text-primary text-sm font-medium hover:underline">
              Continue Shopping →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
