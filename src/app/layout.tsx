import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'
import CartProvider from '@/components/cart/CartProvider'
import ToastProvider from '@/components/ui/ToastProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: { default: 'NeoFuture', template: '%s | NeoFuture' },
  description: 'From trusted hands to quality lives — Women\'s health and wellness products',
  keywords: ['PCOS', 'menstrual cup', 'pregnancy support', 'women wellness', 'nutraceuticals', 'neobalance', 'neoprime', 'neonidra'],
  manifest: '/manifest.json',
  openGraph: {
    siteName: 'NeoFuture',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-brand-dark">
        <SessionProvider session={session}>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
