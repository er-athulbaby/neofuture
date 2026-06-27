import Link from 'next/link'
import { Share2, Mail, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="font-bold text-xl">
                <span className="text-neo-orange">neo</span>future<sup className="text-xs text-gray-400">™</sup>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              From trusted hands to quality lives.<br />
              Science-backed wellness for every woman.
            </p>
            <div className="flex gap-3 mt-5">
              <SocialLink href="#" icon={<Share2 size={18} />} label="Instagram" />
              <SocialLink href="#" icon={<Share2 size={18} />} label="Facebook" />
              <SocialLink href="#" icon={<Share2 size={18} />} label="YouTube" />
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
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary" />
                <span>support@neofuture.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary" />
                <span>+91 XXXXXXXXXX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} NeoFuture. All rights reserved.</span>
          <span>Made with ♥ for every woman</span>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
      {icon}
    </a>
  )
}
