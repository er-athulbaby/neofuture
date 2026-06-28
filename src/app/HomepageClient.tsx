'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import ProductCard from '@/components/products/ProductCard'
import QuizPopup from '@/components/quiz/QuizPopup'
import type { Product } from '@/types'
import type { SiteConfig } from '@/lib/settings'
import {
  Sparkles, ShieldCheck, Truck, RefreshCw, Calculator,
  Baby, Calendar, ChevronLeft, ChevronRight, MessageCircle,
  Activity, Heart, Stethoscope, Users, ArrowRight
} from 'lucide-react'
import InstagramFeed from '@/components/ui/InstagramFeed'

interface Props { config: SiteConfig; featured: Product[]; autoOpenQuiz?: boolean }


const TOOLS = [
  { href: '/tools/due-date', icon: <Calendar size={22} className="text-primary" />, title: 'Due Date Calculator', desc: 'Calculate EDD from LMP, conception date or IVF' },
  { href: '/tools/weight-gain', icon: <Heart size={22} className="text-primary" />, title: 'Pregnancy Weight Gain', desc: 'IOM/NRC 2009 guidelines, twin support' },
  { href: '/tools/vaccination', icon: <Baby size={22} className="text-neo-orange" />, title: 'Vaccination Schedule', desc: 'India NIP — 30+ vaccines with checkoff' },
  { href: '/tools/growth-chart', icon: <Activity size={22} className="text-neo-purple" />, title: 'Baby Growth Chart', desc: 'WHO percentile chart for 0–24 months' },
  { href: '/tools/baby-food', icon: <Stethoscope size={22} className="text-neo-orange" />, title: 'Baby Food Chart', desc: 'Indian foods for 6 months to 2 years' },
]

export default function HomepageClient({ config, featured, autoOpenQuiz = false }: Props) {
  const { data: session } = useSession()

  const [quizOpen, setQuizOpen] = useState(autoOpenQuiz)

  const instagramPosts = config.instagram_posts
    ? config.instagram_posts.split(',').map((u) => u.trim()).filter(Boolean)
    : []

  return (
    <>
      <QuizPopup forceOpen={quizOpen} onClose={() => setQuizOpen(false)} />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-primary-light via-white to-purple-50 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-neo-purple/5 rounded-full blur-2xl" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Sparkles size={13} /> AI-Powered Healthcare
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark leading-tight mb-5">
            {config.hero_title}
          </h1>
          <p className="text-lg text-brand-gray mb-10 max-w-2xl mx-auto leading-relaxed">
            {config.hero_subtitle}
          </p>
          <div className="flex justify-center">
            <button onClick={() => setQuizOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-xl shadow-primary/25 text-base">
              <Sparkles size={18} /> AI Wellness Check-in
            </button>
          </div>

        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="bg-brand-dark text-white py-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 md:gap-10 text-sm">
          {[
            { icon: <ShieldCheck size={15} />, text: '100% Natural Ingredients' },
            { icon: <Truck size={15} />, text: 'Free Shipping Above ₹999' },
            { icon: <Stethoscope size={15} />, text: 'Doctor Recommended' },
            { icon: <RefreshCw size={15} />, text: 'Easy Returns' },
          ].map((t) => (
            <span key={t.text} className="flex items-center gap-2 text-gray-300">{t.icon} {t.text}</span>
          ))}
        </div>
      </div>

      {/* ── AI WELLNESS DASHBOARD ── */}
      <section id="dashboard" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">AI Wellness Dashboard</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">{config.dashboard_title}</h2>
            <p className="text-brand-gray leading-relaxed mb-6">{config.dashboard_subtitle}</p>
            <Link href={session ? '/account' : '/signup'}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
              {session ? 'Open My Dashboard' : 'Get Started Free'} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header bar */}
              <div className="bg-gradient-to-r from-primary to-primary-dark px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">A</div>
                  <div>
                    <p className="text-white text-xs font-semibold">Hello, Ananya!</p>
                    <p className="text-white/70 text-xs">AI Wellness Dashboard</p>
                  </div>
                </div>
                <Sparkles size={18} className="text-white/80" />
              </div>

              <div className="p-5 space-y-4">
                {/* Wellness score row */}
                <div className="flex items-center gap-4">
                  {/* Circle gauge */}
                  <div className="relative flex-shrink-0">
                    <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
                      <circle cx="38" cy="38" r="28" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      <circle cx="38" cy="38" r="28" fill="none" stroke="#D4236A"
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(78 / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-brand-dark leading-none">78</span>
                      <span className="text-xs text-brand-gray">/100</span>
                    </div>
                  </div>
                  {/* Score cards */}
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div className="bg-green-50 rounded-xl p-2.5">
                      <p className="text-xs text-brand-gray">Energy Score</p>
                      <p className="text-base font-bold text-green-600">82</p>
                      <p className="text-xs text-green-600 font-medium">Good</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-2.5">
                      <p className="text-xs text-brand-gray">Stress Level</p>
                      <p className="text-base font-bold text-neo-orange">Moderate</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-2.5">
                      <p className="text-xs text-brand-gray">Hormone Balance</p>
                      <p className="text-base font-bold text-purple-600">71</p>
                      <p className="text-xs text-purple-600 font-medium">Good</p>
                    </div>
                    <div className="bg-primary-light rounded-xl p-2.5">
                      <p className="text-xs text-brand-gray">Sleep Score</p>
                      <p className="text-base font-bold text-primary">68</p>
                      <p className="text-xs text-primary font-medium">Average</p>
                    </div>
                  </div>
                </div>

                {/* Period tracker mini */}
                <div className="bg-primary-light rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary">Next Period</p>
                    <p className="text-sm font-bold text-brand-dark">Jul 18 – Jul 23</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-gray">Ovulation</p>
                    <p className="text-sm font-bold text-purple-600">Jul 4</p>
                  </div>
                </div>

                {/* CTA bar */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-brand-gray">Updated today</span>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    View full dashboard <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              AI-Powered ✦
            </div>
          </div>
        </div>
      </section>

      {/* ── PERIOD TRACKER ── */}
      <section id="period-tracker" className="py-20 px-4 bg-primary-light">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Mock phone UI */}
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="bg-brand-dark rounded-3xl p-1 shadow-2xl w-52">
              <div className="bg-white rounded-[20px] overflow-hidden">
                <div className="bg-primary text-white px-4 pt-4 pb-8">
                  <p className="text-xs font-medium opacity-70">NeoFuture</p>
                  <p className="font-bold text-lg mt-1">Your Cycle</p>
                  <p className="text-sm opacity-80 mt-0.5">Day 14 of 28</p>
                </div>
                <div className="-mt-4 mx-3 bg-white rounded-xl shadow-md p-3">
                  <p className="text-xs font-semibold text-brand-dark mb-2">Next Period</p>
                  <p className="text-lg font-bold text-primary">In 14 days</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
                <div className="mx-3 mt-2 mb-3 bg-primary-light rounded-xl p-3">
                  <p className="text-xs font-medium text-primary">🔔 Ovulation window predicted tomorrow</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Period Tracker</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">{config.period_title}</h2>
            <p className="text-brand-gray leading-relaxed mb-6">{config.period_subtitle}</p>
            <Link href={session ? '/account/period-calendar' : '/signup'}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
              {session ? 'Open Period Tracker' : 'Start Tracking Free'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section id="community" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3 block">Community</span>
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">{config.community_title}</h2>
          <p className="text-brand-gray text-lg leading-relaxed mb-8 max-w-2xl mx-auto">{config.community_subtitle}</p>
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {[
              { icon: <Users size={20} className="text-green-600" />, stat: '200+', label: 'Women & Mothers' },
              { icon: <Stethoscope size={20} className="text-primary" />, stat: 'Live', label: 'Doctor Guidance' },
              { icon: <MessageCircle size={20} className="text-green-600" />, stat: '24/7', label: 'Active Community' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-2xl px-6 py-4 text-center min-w-28">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="font-bold text-brand-dark text-xl">{s.stat}</p>
                <p className="text-xs text-brand-gray">{s.label}</p>
              </div>
            ))}
          </div>
          {config.community_whatsapp ? (
            <a
              href={config.community_whatsapp.startsWith('http') ? config.community_whatsapp : `https://wa.me/${config.community_whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors text-base shadow-lg shadow-green-500/20">
              <MessageCircle size={20} /> Join WhatsApp Community
            </a>
          ) : (
            <div className="inline-flex items-center gap-3 bg-green-100 text-green-700 px-8 py-4 rounded-xl font-semibold">
              <MessageCircle size={20} /> WhatsApp link coming soon
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT US ── */}
      <section id="about" className="py-20 px-4 bg-brand-light">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">About Us</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">{config.about_title}</h2>
            <p className="text-brand-gray leading-relaxed text-lg">{config.about_text}</p>
          </div>
          <div className="flex justify-center">
            {config.about_image ? (
              <div className="relative w-full max-w-sm h-72 rounded-3xl overflow-hidden shadow-xl">
                <Image src={config.about_image} alt="About NeoFuture" fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-sm h-72 rounded-3xl bg-gradient-to-br from-primary-light to-purple-50 border-2 border-dashed border-primary/30 flex items-center justify-center">
                <div className="text-center text-brand-gray">
                  <Heart size={40} className="mx-auto text-primary/30 mb-2" />
                  <p className="text-sm">Add your team photo in<br/>Admin → Settings</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Our Products</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">Nutraceuticals & Wellness</h2>
            <p className="text-brand-gray">Science-backed products trusted by women across India</p>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-brand-gray">
              <p className="font-medium mb-1">No products added yet</p>
              <Link href="/admin/products" className="text-primary text-sm hover:underline">Add products in Admin Panel →</Link>
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/shop" className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary-light transition-colors">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section id="tools" className="py-20 px-4 bg-brand-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Free Tools</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">Wellness Calculators</h2>
            <p className="text-brand-gray">Free with a NeoFuture account — no subscription needed</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOLS.map((t) => (
              <Link key={t.href} href={t.href}
                className="bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-primary hover:shadow-md transition-all group">
                <div className="mb-3">{t.icon}</div>
                <h3 className="font-bold text-brand-dark mb-1 group-hover:text-primary transition-colors">{t.title}</h3>
                <p className="text-sm text-brand-gray">{t.desc}</p>
              </Link>
            ))}
            <div className="bg-primary rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <Sparkles size={22} className="text-white/70 mb-3" />
                <h3 className="font-bold text-white text-lg mb-1">All Tools Free</h3>
                <p className="text-white/70 text-sm">Sign up to access all 5 tools and save your results.</p>
              </div>
              <Link href="/signup" className="mt-4 inline-block bg-white text-primary px-5 py-2.5 rounded-xl font-semibold text-sm text-center hover:opacity-90">
                Create Free Account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM FEED ── */}
      {instagramPosts.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Follow Us</span>
              <h2 className="text-2xl font-bold text-brand-dark">
                {config.instagram_url ? (
                  <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    @neofuture on Instagram
                  </a>
                ) : '@neofuture on Instagram'}
              </h2>
              <p className="text-brand-gray text-sm mt-2">Our latest reels &amp; posts</p>
            </div>
            <InstagramFeed posts={instagramPosts} instagramUrl={config.instagram_url} />
            {config.instagram_url && (
              <div className="text-center mt-8">
                <a href={config.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-gray-200 px-6 py-2.5 rounded-xl font-medium text-brand-dark hover:border-primary hover:text-primary transition-colors text-sm">
                  Follow on Instagram <ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}
