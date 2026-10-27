import { getSiteConfig } from '@/lib/settings'
import Link from 'next/link'

export const metadata = { title: 'Coming Soon' }

export default async function ComingSoonPage() {
  const config = await getSiteConfig()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md">
        {config.logo_url && (
          <img src={config.logo_url} alt={config.site_name} className="h-14 mx-auto mb-8 object-contain" />
        )}
        <h1 className="text-4xl font-bold text-brand-dark mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
          Coming Soon
        </h1>
        <p className="text-brand-gray mb-8">
          We&apos;re working on something special. {config.site_name} will be back shortly.
        </p>
        {config.contact_email && (
          <p className="text-sm text-brand-gray">
            Questions? <a href={`mailto:${config.contact_email}`} className="text-primary underline">{config.contact_email}</a>
          </p>
        )}
        <Link href="/login" className="mt-8 inline-block text-xs text-gray-300 hover:text-gray-400 transition-colors">
          Admin Login
        </Link>
      </div>
    </div>
  )
}
