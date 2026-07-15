'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/components/cart/CartProvider'
import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, User, Menu, X, ChevronDown, Calculator, Calendar, Baby, Activity, Stethoscope, Heart, Trash2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/neo-twin', label: 'Neo Twin ✦', auth: true },
  { href: '/account', label: 'AI Wellness Dashboard', auth: true },
  { href: '/account/period-calendar', label: 'Period Tracker', auth: true },
  { href: '#community', label: 'Community', scroll: true },
  {
    label: 'Tools / Calculators', dropdown: [
      { href: '/tools/due-date', icon: <Calendar size={14} />, label: 'Due Date Calculator' },
      { href: '/tools/weight-gain', icon: <Activity size={14} />, label: 'Pregnancy Weight Gain' },
      { href: '/tools/vaccination', icon: <Baby size={14} />, label: 'Vaccination Schedule' },
      { href: '/tools/growth-chart', icon: <Calculator size={14} />, label: 'Baby Growth Chart' },
      { href: '/tools/baby-food', icon: <Stethoscope size={14} />, label: 'Baby Food Chart' },
    ]
  },
  { href: '/#products', label: 'Nutraceuticals', scrollId: 'products' },
  { href: '/shop', label: 'Shop' },
]

export default function Navbar({ logoUrl = '', siteName = 'NeoFuture' }: { logoUrl?: string; siteName?: string }) {
  const { data: session } = useSession()
  const { items, itemCount, subtotal, removeItem } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [npBalance, setNpBalance] = useState<number | null>(null)
  const [npCheckedIn, setNpCheckedIn] = useState(false)
  const pathname = usePathname()
  const cartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close cart drawer on route change
  useEffect(() => { setCartOpen(false); setMenuOpen(false) }, [pathname])

  // Load NP balance for logged-in users
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/neopulse/balance')
      .then((r) => r.json())
      .then((d) => { setNpBalance(d.balance ?? 0); setNpCheckedIn(d.checked_in_today ?? false) })
      .catch(() => {})
  }, [session])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (cartOpen && cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [cartOpen])

  function scrollTo(id: string) {
    setMenuOpen(false)
    if (pathname !== '/') { window.location.href = `/${id}` ; return }
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header className={cn('sticky top-0 z-50 bg-white border-b transition-shadow', scrolled ? 'shadow-md border-gray-100' : 'shadow-sm border-gray-50')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-14 w-auto max-w-[180px] object-contain" />
              ) : (
                <span className="font-bold text-xl">
                  <span className="text-neo-orange">neo</span>
                  <span className="text-brand-dark">future</span>
                  <sup className="text-xs text-brand-gray">™</sup>
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              {NAV_LINKS.map((link) => {
                if (link.auth && !session) return null

                if (link.dropdown) {
                  return (
                    <div key={link.label} className="relative"
                      onMouseEnter={() => setToolsOpen(true)}
                      onMouseLeave={() => setToolsOpen(false)}>
                      <Link href="/tools"
                        className={cn('flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-brand-gray hover:text-primary hover:bg-primary-light',
                          pathname.startsWith('/tools') ? 'text-primary bg-primary-light' : '')}>
                        {link.label} <ChevronDown size={12} />
                      </Link>
                      {toolsOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                          {link.dropdown.map((item) => (
                            <Link key={item.href} href={item.href}
                              onClick={() => setToolsOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-dark hover:bg-primary-light hover:text-primary transition-colors">
                              <span className="text-primary">{item.icon}</span> {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                if (link.scrollId) {
                  return (
                    <button key={link.label}
                      onClick={() => scrollTo(`#${link.scrollId}`)}
                      className="px-3 py-2 rounded-lg text-brand-gray hover:text-primary hover:bg-primary-light transition-colors">
                      {link.label}
                    </button>
                  )
                }

                if (link.scroll) {
                  return (
                    <button key={link.label}
                      onClick={() => scrollTo(`#${(link.href as string).replace('#', '')}`)}
                      className="px-3 py-2 rounded-lg text-brand-gray hover:text-primary hover:bg-primary-light transition-colors">
                      {link.label}
                    </button>
                  )
                }

                return (
                  <Link key={link.href} href={link.href as string}
                    className={cn('px-3 py-2 rounded-lg transition-colors',
                      pathname === link.href ? 'text-primary bg-primary-light font-semibold' : 'text-brand-gray hover:text-primary hover:bg-primary-light')}>
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* NeoPulse badge */}
              {session?.user && npBalance !== null && (
                <Link href="/neopulse" className="relative hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-primary to-neo-purple text-white text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                  <Zap size={12} />
                  {npBalance} NP
                  {!npCheckedIn && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white animate-pulse" />
                  )}
                </Link>
              )}

              {/* Cart icon — opens mini-cart drawer */}
              <button
                onClick={() => setCartOpen((o) => !o)}
                className="relative p-2 hover:bg-primary-light rounded-lg transition-colors"
              >
                <ShoppingCart size={21} className="text-brand-dark" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              {session?.user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 hover:bg-primary-light rounded-lg transition-colors">
                    <div className="w-7 h-7 rounded-full bg-primary-light border-2 border-primary flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">{session.user.name?.charAt(0).toUpperCase() ?? 'U'}</span>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-brand-dark truncate max-w-20">
                      {session.user.name?.split(' ')[0]}
                    </span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs text-brand-gray">Signed in as</p>
                      <p className="text-sm font-medium text-brand-dark truncate">{session.user.name}</p>
                    </div>
                    <Link href="/account" className="block px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">My Dashboard</Link>
                    <Link href="/neopulse" className="flex items-center justify-between px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">
                      <span className="flex items-center gap-1.5"><Zap size={13} className="text-primary" /> NeoPulse</span>
                      {npBalance !== null && <span className="text-xs font-bold text-primary">{npBalance} NP</span>}
                    </Link>
                    <Link href="/account/orders" className="block px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">My Orders</Link>
                    <Link href="/account/wishlist" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">
                      <Heart size={13} /> Wishlist
                    </Link>
                    <Link href="/account/period-calendar" className="block px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">Period Tracker</Link>
                    {session.user.is_admin && (
                      <>
                        <hr className="my-1 border-gray-100" />
                        <Link href="/admin" className="block px-4 py-2 text-sm text-neo-orange font-medium hover:bg-orange-50">Admin Panel</Link>
                      </>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login"
                  className="hidden sm:flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                  <User size={15} /> Sign In
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
            <MobileLink href="/" label="Home" onClick={() => setMenuOpen(false)} active={pathname === '/'} />
            {session ? (
              <>
                <MobileLink href="/account" label="AI Wellness Dashboard" onClick={() => setMenuOpen(false)} active={pathname === '/account'} />
                <MobileLink href="/account/period-calendar" label="Period Tracker" onClick={() => setMenuOpen(false)} active={pathname.startsWith('/account/period')} />
                <MobileLink href="/account/wishlist" label="Wishlist" onClick={() => setMenuOpen(false)} active={pathname === '/account/wishlist'} />
              </>
            ) : null}
            <button onClick={() => scrollTo('#community')} className="block w-full text-left text-sm font-medium text-brand-dark hover:text-primary py-2.5 px-2 rounded-lg hover:bg-primary-light transition-colors">Community</button>
            <Link href="/tools" onClick={() => setMenuOpen(false)}
              className="block mx-2 mt-1 mb-0.5 text-xs font-semibold text-brand-gray uppercase tracking-wider hover:text-primary transition-colors">
              Tools &amp; Calculators
            </Link>
            <MobileLink href="/tools/due-date" label="Due Date Calculator" onClick={() => setMenuOpen(false)} />
            <MobileLink href="/tools/weight-gain" label="Pregnancy Weight Gain" onClick={() => setMenuOpen(false)} />
            <MobileLink href="/tools/vaccination" label="Vaccination Schedule" onClick={() => setMenuOpen(false)} />
            <MobileLink href="/tools/growth-chart" label="Baby Growth Chart" onClick={() => setMenuOpen(false)} />
            <MobileLink href="/tools/baby-food" label="Baby Food Chart" onClick={() => setMenuOpen(false)} />
            <button onClick={() => { setMenuOpen(false); scrollTo('#products') }} className="block w-full text-left text-sm font-medium text-brand-dark hover:text-primary py-2.5 px-2 rounded-lg hover:bg-primary-light transition-colors">Nutraceuticals</button>
            <MobileLink href="/shop" label="Shop" onClick={() => setMenuOpen(false)} active={pathname.startsWith('/shop')} />
            {!session && (
              <div className="pt-2">
                <Link href="/login" className="block text-center bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold" onClick={() => setMenuOpen(false)}>
                  Sign In / Create Account
                </Link>
              </div>
            )}
            {session?.user && (
              <>
                <hr className="my-2 border-gray-100" />
                {session.user.is_admin && (
                  <MobileLink href="/admin" label="Admin Panel" onClick={() => setMenuOpen(false)} className="text-neo-orange font-semibold" />
                )}
                <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }} className="block w-full text-left text-sm font-medium text-red-500 py-2.5 px-2">
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Mini-cart drawer overlay */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div ref={cartRef} className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-brand-dark text-lg flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" />
                Cart {itemCount > 0 && <span className="text-sm font-normal text-brand-gray">({itemCount} items)</span>}
              </h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ShoppingCart size={40} className="text-gray-200 mb-3" />
                  <p className="text-brand-gray font-medium">Your cart is empty</p>
                  <Link href="/shop" onClick={() => setCartOpen(false)}
                    className="mt-4 text-sm text-primary font-medium hover:underline">
                    Browse Products →
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product_id} className="flex gap-3">
                    <Link href={`/products/${item.slug}`} onClick={() => setCartOpen(false)}
                      className="w-16 h-16 flex-shrink-0 bg-brand-light rounded-xl overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.slug}`} onClick={() => setCartOpen(false)}
                        className="text-sm font-medium text-brand-dark hover:text-primary line-clamp-2 leading-snug">
                        {item.name}
                      </Link>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-semibold text-brand-dark">
                          {formatPrice((item.sale_price ?? item.price) * item.quantity)}
                        </span>
                        <span className="text-xs text-brand-gray">×{item.quantity}</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.product_id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm text-brand-gray">
                  <span>Shipping</span>
                  <span className={subtotal >= 999 ? 'text-success font-medium' : ''}>
                    {subtotal >= 999 ? 'Free' : '₹50'}
                  </span>
                </div>
                {subtotal < 999 && (
                  <p className="text-xs text-brand-gray bg-brand-light rounded-lg px-3 py-2">
                    Add {formatPrice(999 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between font-bold text-brand-dark">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href="/cart" onClick={() => setCartOpen(false)}
                    className="flex-1 text-center border-2 border-primary text-primary py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors">
                    View Cart
                  </Link>
                  <Link href="/checkout" onClick={() => setCartOpen(false)}
                    className="flex-1 text-center bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors">
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function MobileLink({ href, label, onClick, active, className }: { href: string; label: string; onClick: () => void; active?: boolean; className?: string }) {
  return (
    <Link href={href} onClick={onClick}
      className={cn('block text-sm font-medium py-2.5 px-2 rounded-lg transition-colors', active ? 'text-primary bg-primary-light' : 'text-brand-dark hover:text-primary hover:bg-primary-light', className)}>
      {label}
    </Link>
  )
}
