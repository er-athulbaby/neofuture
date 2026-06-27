'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/cart/CartProvider'
import { useToast } from '@/components/ui/ToastProvider'

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const { toast } = useToast()

  const image = product.images?.[0] ?? '/images/placeholder.png'
  const price = product.sale_price ?? product.price
  const hasDiscount = product.sale_price && product.sale_price < product.price

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (product.stock <= 0) return
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image,
      price: product.price,
      sale_price: product.sale_price,
      quantity: 1,
      stock: product.stock,
    })
    toast(`${product.name} added to cart!`)
  }

  return (
    <div className="product-card bg-white rounded-2xl border border-gray-100 overflow-hidden group">
      <Link href={`/products/${product.slug}`} className="block relative">
        {/* Image */}
        <div className="relative h-56 bg-brand-light overflow-hidden">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-lg">
              {Math.round(((product.price - product.sale_price!) / product.price) * 100)}% OFF
            </span>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category_name && (
            <span className="text-xs text-brand-gray uppercase tracking-wide">{product.category_name}</span>
          )}
          <h3 className="font-semibold text-brand-dark mt-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.flavor && (
            <p className="text-xs text-brand-gray mt-0.5">{product.flavor}</p>
          )}

          {/* Rating */}
          {Number(product.avg_rating) > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-brand-gray">
                {Number(product.avg_rating).toFixed(1)} ({product.review_count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-3">
            <span className="font-bold text-lg text-brand-dark">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-sm text-brand-gray line-through">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ShoppingCart size={16} />
          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
