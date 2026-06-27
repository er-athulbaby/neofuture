'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/components/cart/CartProvider'
import { useState } from 'react'
import { ShoppingCart, User, Menu, X, Stethoscope, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const { data: session } = useSession()
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl">
              <span className="text-neo-orange">neo</span>
              <span className="text-brand-dark">future</span>
              <sup className="text-xs text-brand-gray">™</sup>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/shop" className="text-brand-gray hover:text-primary transition-colors">
              Shop
            </Link>

            {/* Tools dropdown */}
            <div className="relative" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
              <button className="flex items-center gap-1 text-brand-gray hover:text-primary transition-colors">
                Tools <ChevronDown size={14} />
              </button>
              {toolsOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <ToolLink href="/tools" label="All Tools" />
                  <ToolLink href="/tools/due-date" label="Due Date Calculator" />
                  <ToolLink href="/tools/weight-gain" label="Pregnancy Weight Gain" />
                  <ToolLink href="/tools/vaccination" label="Vaccination Schedule" />
                  <ToolLink href="/tools/growth-chart" label="Baby Growth Chart" />
                  <ToolLink href="/tools/baby-food" label="Baby Food Chart" />
                </div>
              )}
            </div>

            <Link href="/shop/nutraceuticals" className="text-brand-gray hover:text-primary transition-colors">
              Nutraceuticals
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-primary-light rounded-lg transition-colors">
              <ShoppingCart size={22} className="text-brand-dark" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {session?.user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 hover:bg-primary-light rounded-lg transition-colors">
                  <User size={22} className="text-brand-dark" />
                  <span className="hidden md:block text-sm font-medium text-brand-dark truncate max-w-24">
                    {session.user.name?.split(' ')[0]}
                  </span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/account" className="block px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">
                    My Dashboard
                  </Link>
                  <Link href="/account/orders" className="block px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">
                    My Orders
                  </Link>
                  <Link href="/account/period-calendar" className="block px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary">
                    Period Calendar
                  </Link>
                  {session.user.is_admin && (
                    <>
                      <hr className="my-2 border-gray-100" />
                      <Link href="/admin" className="block px-4 py-2 text-sm text-neo-orange hover:bg-neo-orange-light font-medium">
                        Admin Panel
                      </Link>
                    </>
                  )}
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <User size={16} />
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <MobileNavLink href="/shop" label="Shop" onClick={() => setMenuOpen(false)} />
          <MobileNavLink href="/tools" label="Tools & Calculators" onClick={() => setMenuOpen(false)} />
          <MobileNavLink href="/tools/due-date" label="  → Due Date Calculator" onClick={() => setMenuOpen(false)} />
          <MobileNavLink href="/tools/vaccination" label="  → Vaccination Schedule" onClick={() => setMenuOpen(false)} />
          <MobileNavLink href="/tools/growth-chart" label="  → Baby Growth Chart" onClick={() => setMenuOpen(false)} />
          <MobileNavLink href="/tools/baby-food" label="  → Baby Food Chart" onClick={() => setMenuOpen(false)} />
          {session?.user ? (
            <>
              <MobileNavLink href="/account" label="My Dashboard" onClick={() => setMenuOpen(false)} />
              <MobileNavLink href="/account/orders" label="My Orders" onClick={() => setMenuOpen(false)} />
              {session.user.is_admin && (
                <MobileNavLink href="/admin" label="Admin Panel" onClick={() => setMenuOpen(false)} />
              )}
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                className="w-full text-left text-sm text-danger font-medium py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block text-center bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Sign In / Create Account
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-dark hover:bg-primary-light hover:text-primary transition-colors">
      <Stethoscope size={14} className="text-primary" />
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block text-sm font-medium text-brand-dark hover:text-primary py-2">
      {label}
    </Link>
  )
}
