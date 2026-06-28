import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'
import CartProvider from '@/components/cart/CartProvider'
import ToastProvider from '@/components/ui/ToastProvider'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { getSiteConfig } from '@/lib/settings'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  return {
    title: { default: 'NeoFuture', template: '%s | NeoFuture' },
    description: "From trusted hands to quality lives — Women's health and wellness products",
    keywords: ['PCOS', 'menstrual cup', 'pregnancy support', 'women wellness', 'nutraceuticals'],
    manifest: '/manifest.json',
    openGraph: { siteName: 'NeoFuture', type: 'website' },
    icons: {
      icon: config.favicon_url || '/favicon.ico',
      shortcut: config.favicon_url || '/favicon.ico',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, config] = await Promise.all([auth(), getSiteConfig()])

  const themeVars = `
    :root {
      --color-primary: ${config.color_primary};
      --color-primary-dark: ${config.color_primary_dark};
      --color-primary-light: ${config.color_primary_light};
      --color-neo-orange: ${config.color_neo_orange};
      --color-neo-purple: ${config.color_neo_purple};
      --color-brand-dark: ${config.color_brand_dark};
    }
  `

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-brand-dark">
        <SessionProvider session={session}>
          <CartProvider>
            <ToastProvider>
              <Navbar logoUrl={config.logo_url} siteName={config.site_name} />
              <main className="flex-1">{children}</main>
              <Footer
                logoUrl={config.logo_url}
                siteName={config.site_name}
                tagline={config.tagline}
                instagramUrl={config.instagram_url}
                facebookUrl={config.facebook_url}
                contactEmail={config.contact_email}
                contactPhone={config.contact_phone}
                whatsappNumber={config.whatsapp_number}
              />
              <WhatsAppButton number={config.whatsapp_number} />
            </ToastProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
