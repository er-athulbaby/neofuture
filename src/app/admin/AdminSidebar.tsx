'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Settings,
  ChevronLeft, ChevronRight, MessageSquare, ExternalLink, HelpCircle, FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/leads', label: 'Leads', icon: MessageSquare },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/quiz', label: 'Quiz Config', icon: HelpCircle },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'flex flex-col bg-brand-dark text-white transition-all duration-300 sticky top-0 h-screen flex-shrink-0',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <span className="font-bold text-sm">
            <span className="text-neo-orange">neo</span>
            <span className="text-white">future</span>
            <span className="text-white/40 text-xs ml-1">admin</span>
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors ml-auto">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer links */}
      <div className="px-2 pb-4 space-y-0.5 border-t border-white/10 pt-4">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors">
          <ExternalLink size={18} className="flex-shrink-0" />
          {!collapsed && <span>View Site</span>}
        </Link>
      </div>
    </aside>
  )
}
