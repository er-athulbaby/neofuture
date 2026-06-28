'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/components/cart/CartProvider'
import { useState, useEffect } from 'react'
import { ShoppingCart, User, Menu, X, ChevronDown, Calculator, Calendar, Baby, Activity, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
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
  { href: '/shop', label: 'Products' },
  { href: '#about', label: 'About Us', scroll: true },
]

export default function Navbar({ logoUrl = '', siteName = 'NeoFuture' }: { logoUrl?: string; siteName?: string }) {
  const { data: session } = useSession()
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    setMenuOpen(false)
    if (pathname !== '/') { window.location.href = `/${id}` ; return }
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
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
            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-primary-light rounded-lg transition-colors">
              <ShoppingCart size={21} className="text-brand-dark" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

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
                  <Link href="/account/orders" className="block px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">My Orders</Link>
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
          <MobileLink href="/shop" label="Products" onClick={() => setMenuOpen(false)} active={pathname.startsWith('/shop')} />
          <button onClick={() => scrollTo('#about')} className="block w-full text-left text-sm font-medium text-brand-dark hover:text-primary py-2.5 px-2 rounded-lg hover:bg-primary-light transition-colors">About Us</button>
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
