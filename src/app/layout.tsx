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

export const metadata: Metadata = {
  title: { default: 'NeoFuture', template: '%s | NeoFuture' },
  description: "From trusted hands to quality lives — Women's health and wellness products",
  keywords: ['PCOS', 'menstrual cup', 'pregnancy support', 'women wellness', 'nutraceuticals'],
  manifest: '/manifest.json',
  openGraph: { siteName: 'NeoFuture', type: 'website' },
}

// Only hex colors are valid CSS custom property values here.
// Accepting arbitrary strings would allow CSS context escape via dangerouslySetInnerHTML.
const CSS_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/
function safeCssColor(value: string, fallback: string): string {
  return CSS_COLOR_RE.test(value.trim()) ? value.trim() : fallback
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, config] = await Promise.all([auth(), getSiteConfig()])

  const themeVars = `
    :root {
      --color-primary: ${safeCssColor(config.color_primary, '#D4236A')};
      --color-primary-dark: ${safeCssColor(config.color_primary_dark, '#A81B54')};
      --color-primary-light: ${safeCssColor(config.color_primary_light, '#FBE8F2')};
      --color-neo-orange: ${safeCssColor(config.color_neo_orange, '#E07B2A')};
      --color-neo-purple: ${safeCssColor(config.color_neo_purple, '#7B35A8')};
      --color-brand-dark: ${safeCssColor(config.color_brand_dark, '#1A1535')};
    }
  `

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
        {config.favicon_url && /^https?:\/\//.test(config.favicon_url) ? (
          <>
            <link rel="icon" type="image/png" href={config.favicon_url} key="favicon-dynamic" />
            <link rel="shortcut icon" href={config.favicon_url} key="shortcut-dynamic" />
          </>
        ) : (
          <link rel="icon" href="/favicon.ico" key="favicon-default" />
        )}
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
