import Link from 'next/link'
import { query } from '@/lib/db'
import type { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'
import QuizPopup from '@/components/quiz/QuizPopup'
import { Sparkles, ShieldCheck, Truck, RefreshCw, Calculator, Baby, Calendar } from 'lucide-react'

export default async function HomePage() {
  const featured: Product[] = await query<Product>(
    `SELECT p.*, c.name as category_name, c.slug as category_slug,
      COALESCE(AVG(r.rating),0)::numeric(3,1) as avg_rating,
      COUNT(r.id)::int as review_count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_reviews r ON r.product_id = p.id
     WHERE p.is_featured = true AND p.is_active = true
     GROUP BY p.id, c.name, c.slug
     ORDER BY p.created_at DESC
     LIMIT 6`
  ).catch(() => [])

  return (
    <>
      <QuizPopup />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-light via-white to-neo-orange-light py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles size={14} />
              AI-Powered Wellness Recommendations
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark leading-tight mb-5">
              From trusted hands<br />
              <span className="text-primary">to quality lives</span>
            </h1>
            <p className="text-lg text-brand-gray mb-8 max-w-lg mx-auto lg:mx-0">
              Science-backed wellness products for every woman — from PCOS support to pregnancy care, and everything in between.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/shop"
                className="bg-primary text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
              >
                Shop Now
              </Link>
              <Link
                href="#"
                className="border-2 border-primary text-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-light transition-colors"
              >
                Take Wellness Quiz
              </Link>
            </div>
          </div>

          {/* Product showcase */}
          <div className="flex-1 grid grid-cols-3 gap-4 max-w-md">
            <ProductPill name="balance" color="primary" sub="PCOS Support" />
            <ProductPill name="prime" color="neo-orange" sub="Daily Vitality" />
            <ProductPill name="nidra" color="neo-purple" sub="Calm & Sleep" />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-brand-dark text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm font-medium">
          <TrustItem icon={<ShieldCheck size={16} />} text="100% Natural" />
          <TrustItem icon={<Truck size={16} />} text="Free Shipping Above ₹999" />
          <TrustItem icon={<RefreshCw size={16} />} text="Easy Returns" />
          <TrustItem icon={<Sparkles size={16} />} text="AI Wellness Recommendations" />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-brand-dark">Featured Products</h2>
              <p className="text-brand-gray mt-1">Bestsellers loved by women like you</p>
            </div>
            <Link href="/shop" className="text-primary font-medium hover:text-primary-dark text-sm">
              View All →
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-brand-gray">
              <p className="text-lg font-medium mb-2">Products coming soon!</p>
              <Link href="/admin/products" className="text-primary text-sm">Add products in admin →</Link>
            </div>
          )}
        </div>
      </section>

      {/* Tools teaser */}
      <section className="py-16 px-4 bg-brand-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-brand-dark mb-2">Free Wellness Tools</h2>
            <p className="text-brand-gray">Helpful calculators for every stage of your journey — free with a NeoFuture account</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ToolCard href="/tools/due-date" icon={<Calendar className="text-primary" size={24} />} title="Due Date Calculator" desc="Calculate your EDD from LMP, conception date, or IVF transfer" color="primary" />
            <ToolCard href="/tools/vaccination" icon={<Baby className="text-neo-orange" size={24} />} title="Vaccination Schedule" desc="India NIP schedule with personalized tracking for your baby" color="neo-orange" />
            <ToolCard href="/tools/growth-chart" icon={<Calculator className="text-neo-purple" size={24} />} title="Baby Growth Chart" desc="WHO percentile chart for weight, height & head circumference" color="neo-purple" />
            <ToolCard href="/tools/weight-gain" icon={<ShieldCheck className="text-primary" size={24} />} title="Pregnancy Weight Gain" desc="Check if your weight gain is on track based on your BMI" color="primary" />
            <ToolCard href="/tools/baby-food" icon={<Sparkles className="text-neo-orange" size={24} />} title="Baby Food Chart" desc="Age-appropriate Indian foods for 6 months to 2 years" color="neo-orange" />
            <div className="tool-card bg-primary text-white rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-2">All Tools Free</h3>
                <p className="text-white/80 text-sm">Create a free account to access all 5 wellness tools and save your results.</p>
              </div>
              <Link href="/signup" className="mt-4 inline-block bg-white text-primary px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Create Free Account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-primary-dark text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Sparkles className="mx-auto mb-4 opacity-80" size={32} />
          <h2 className="text-3xl font-bold mb-3">Not sure which product is right for you?</h2>
          <p className="text-white/80 text-lg mb-6">
            Take our 2-minute AI wellness quiz and get a personalized recommendation.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-primary px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Take the Free Wellness Quiz
          </Link>
        </div>
      </section>
    </>
  )
}

function ProductPill({ name, color, sub }: { name: string; color: string; sub: string }) {
  const bgMap: Record<string, string> = {
    primary: 'bg-primary-light border-primary/20',
    'neo-orange': 'bg-neo-orange-light border-neo-orange/20',
    'neo-purple': 'bg-neo-purple-light border-neo-purple/20',
  }
  const textMap: Record<string, string> = {
    primary: 'text-primary',
    'neo-orange': 'text-neo-orange',
    'neo-purple': 'text-neo-purple',
  }
  return (
    <div className={`${bgMap[color]} border-2 rounded-2xl p-4 text-center`}>
      <div className={`font-bold text-sm ${textMap[color]}`}>neo</div>
      <div className="font-bold text-brand-dark">{name}</div>
      <div className="text-xs text-brand-gray mt-1">{sub}</div>
    </div>
  )
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-300">
      {icon}
      <span>{text}</span>
    </div>
  )
}

function ToolCard({ href, icon, title, desc, color }: { href: string; icon: React.ReactNode; title: string; desc: string; color: string }) {
  const borderMap: Record<string, string> = {
    primary: 'hover:border-primary',
    'neo-orange': 'hover:border-neo-orange',
    'neo-purple': 'hover:border-neo-purple',
  }
  return (
    <Link href={href} className={`tool-card bg-white border-2 border-gray-100 ${borderMap[color]} rounded-2xl p-6 block`}>
      <div className="mb-3">{icon}</div>
      <h3 className="font-bold text-brand-dark mb-1">{title}</h3>
      <p className="text-sm text-brand-gray">{desc}</p>
    </Link>
  )
}
