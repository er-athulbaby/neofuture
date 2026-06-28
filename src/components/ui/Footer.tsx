import Link from 'next/link'
import { Mail, Phone, MessageCircle } from 'lucide-react'

interface FooterProps {
  logoUrl?: string
  siteName?: string
  tagline?: string
  instagramUrl?: string
  facebookUrl?: string
  contactEmail?: string
  contactPhone?: string
  whatsappNumber?: string
}

export default function Footer({
  logoUrl = '',
  siteName = 'NeoFuture',
  tagline = 'From trusted hands to quality lives.',
  instagramUrl = '',
  facebookUrl = '',
  contactEmail = '',
  contactPhone = '',
  whatsappNumber = '',
}: FooterProps) {
  return (
    <footer className="bg-brand-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-10 w-auto max-w-[144px] object-contain brightness-0 invert" />
              ) : (
                <span className="font-bold text-xl">
                  <span className="text-neo-orange">neo</span>future<sup className="text-xs text-gray-400">™</sup>
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{tagline}<br />Science-backed wellness for every woman.</p>
            <div className="flex gap-3 mt-5">
              {instagramUrl ? (
                <SocialLink href={instagramUrl} label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </SocialLink>
              ) : (
                <SocialLink href="#" label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </SocialLink>
              )}
              {facebookUrl && (
                <SocialLink href={facebookUrl} label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </SocialLink>
              )}
              {whatsappNumber && (
                <SocialLink href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} label="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </SocialLink>
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/shop/nutraceuticals" className="hover:text-primary transition-colors">Nutraceuticals</Link></li>
              <li><Link href="/shop/period-care" className="hover:text-primary transition-colors">Period Care</Link></li>
              <li><Link href="/shop/pregnancy" className="hover:text-primary transition-colors">Pregnancy</Link></li>
              <li><Link href="/shop/baby-care" className="hover:text-primary transition-colors">Baby Care</Link></li>
              <li><Link href="/shop?featured=true" className="hover:text-primary transition-colors">Featured Products</Link></li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-white mb-4">Free Tools</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/tools/due-date" className="hover:text-primary transition-colors">Due Date Calculator</Link></li>
              <li><Link href="/tools/weight-gain" className="hover:text-primary transition-colors">Pregnancy Weight Gain</Link></li>
              <li><Link href="/tools/vaccination" className="hover:text-primary transition-colors">Vaccination Schedule</Link></li>
              <li><Link href="/tools/growth-chart" className="hover:text-primary transition-colors">Baby Growth Chart</Link></li>
              <li><Link href="/tools/baby-food" className="hover:text-primary transition-colors">Baby Food Chart</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/account/orders" className="hover:text-primary transition-colors">Track Order</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
            <div className="mt-5 space-y-2 text-sm text-gray-400">
              {contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-primary flex-shrink-0" />
                  <span>{contactEmail}</span>
                </div>
              )}
              {contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-primary flex-shrink-0" />
                  <span>{contactPhone}</span>
                </div>
              )}
              {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <MessageCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span>WhatsApp Chat</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <span>Made with ♥ for every woman</span>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label}
      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
      {children}
    </a>
  )
}
