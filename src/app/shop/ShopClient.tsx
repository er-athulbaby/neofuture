'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Product, Category } from '@/types'
import ProductCard from '@/components/products/ProductCard'
import AIProductAdvisor from '@/components/ai/AIProductAdvisor'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

const PAGE_SIZE = 12

interface Props { initialProducts: Product[]; categories: Category[] }

export default function ShopClient({ initialProducts, categories }: Props) {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  // Sync URL ?q param (set by AI advisor)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
  }, [searchParams])
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState('featured')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    setVisibleCount(PAGE_SIZE)
    let products = [...initialProducts]
    if (category) products = products.filter((p) => p.category_slug === category)
    if (search) products = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    if (minPrice) products = products.filter((p) => (p.sale_price ?? p.price) >= Number(minPrice))
    if (maxPrice) products = products.filter((p) => (p.sale_price ?? p.price) <= Number(maxPrice))

    switch (sort) {
      case 'price_asc': products.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price)); break
      case 'price_desc': products.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price)); break
      case 'rating': products.sort((a, b) => Number(b.avg_rating) - Number(a.avg_rating)); break
      default: products.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break
    }
    return products
  }, [initialProducts, category, search, sort, minPrice, maxPrice])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar filters */}
        <aside className="lg:w-56 flex-shrink-0">
          <h3 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filters
          </h3>

          {/* Categories */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">Category</p>
            <div className="space-y-1.5">
              <button onClick={() => setCategory(null)}
                className={cn('w-full text-left text-sm px-3 py-2 rounded-lg transition-colors', !category ? 'bg-primary text-white' : 'text-brand-dark hover:bg-primary-light')}>
                All Products
              </button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.slug)}
                  className={cn('w-full text-left text-sm px-3 py-2 rounded-lg transition-colors', category === c.slug ? 'bg-primary text-white' : 'text-brand-dark hover:bg-primary-light')}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">Price Range (₹)</p>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary text-brand-dark">
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <AIProductAdvisor />
          </div>

          <p className="text-sm text-brand-gray mb-4">{filtered.length} products</p>

          {filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.slice(0, visibleCount).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {visibleCount < filtered.length && (
                <div className="flex flex-col items-center mt-10 gap-2">
                  <p className="text-sm text-brand-gray">Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} products</p>
                  <button
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                    className="px-8 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-brand-gray">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
