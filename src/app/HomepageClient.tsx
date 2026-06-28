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

interface Props { config: SiteConfig; featured: Product[] }

const DASHBOARD_SLIDES = [
  { label: 'Wellness Score', desc: 'Track your hormone, stress & energy scores daily', color: 'from-primary/10 to-primary/5', icon: <Activity size={32} className="text-primary" /> },
  { label: 'Quiz History', desc: 'See your past wellness assessments and progress', color: 'from-neo-orange/10 to-neo-orange/5', icon: <Sparkles size={32} className="text-neo-orange" /> },
  { label: 'Order Tracking', desc: 'Monitor your orders and delivery status in real time', color: 'from-neo-purple/10 to-neo-purple/5', icon: <ShieldCheck size={32} className="text-neo-purple" /> },
]

const TOOLS = [
  { href: '/tools/due-date', icon: <Calendar size={22} className="text-primary" />, title: 'Due Date Calculator', desc: 'Calculate EDD from LMP, conception date or IVF' },
  { href: '/tools/weight-gain', icon: <Heart size={22} className="text-primary" />, title: 'Pregnancy Weight Gain', desc: 'IOM/NRC 2009 guidelines, twin support' },
  { href: '/tools/vaccination', icon: <Baby size={22} className="text-neo-orange" />, title: 'Vaccination Schedule', desc: 'India NIP — 30+ vaccines with checkoff' },
  { href: '/tools/growth-chart', icon: <Activity size={22} className="text-neo-purple" />, title: 'Baby Growth Chart', desc: 'WHO percentile chart for 0–24 months' },
  { href: '/tools/baby-food', icon: <Stethoscope size={22} className="text-neo-orange" />, title: 'Baby Food Chart', desc: 'Indian foods for 6 months to 2 years' },
]

export default function HomepageClient({ config, featured }: Props) {
  const { data: session } = useSession()
  const [slide, setSlide] = useState(0)
  const [quizOpen, setQuizOpen] = useState(false)
  const slideTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    slideTimer.current = setInterval(() => setSlide((s) => (s + 1) % DASHBOARD_SLIDES.length), 4000)
    return () => { if (slideTimer.current) clearInterval(slideTimer.current) }
  }, [])

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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setQuizOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-xl shadow-primary/25 text-base">
              <Sparkles size={18} /> AI Wellness Check-in
            </button>
            <Link href="#products"
              className="inline-flex items-center gap-2 border-2 border-gray-200 text-brand-dark px-8 py-4 rounded-xl font-semibold hover:border-primary hover:text-primary transition-colors text-base">
              Explore Products <ArrowRight size={18} />
            </Link>
          </div>

          {/* 3 product pills */}
          <div className="flex justify-center gap-4 mt-12 flex-wrap">
            {[
              { name: 'Neo Balance', sub: 'PCOS Support', color: 'border-primary/30 bg-primary-light text-primary' },
              { name: 'Neo Prime', sub: 'Daily Vitality', color: 'border-neo-orange/30 bg-orange-50 text-neo-orange' },
              { name: 'Neo Nidra', sub: 'Calm & Sleep', color: 'border-neo-purple/30 bg-purple-50 text-neo-purple' },
            ].map((p) => (
              <div key={p.name} className={`border-2 ${p.color} rounded-2xl px-5 py-3 text-center min-w-28`}>
                <p className="font-bold text-sm">{p.name}</p>
                <p className="text-xs opacity-70 mt-0.5">{p.sub}</p>
              </div>
            ))}
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

          {/* Slideshow */}
          <div className="relative">
            <div className={`bg-gradient-to-br ${DASHBOARD_SLIDES[slide].color} rounded-3xl p-8 h-56 flex flex-col justify-between border border-gray-100 shadow-xl transition-all duration-500`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-gray uppercase tracking-wide">NeoFuture Dashboard</span>
                <div className="flex gap-1">
                  {DASHBOARD_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === slide ? 'bg-primary w-5' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
              <div>
                {DASHBOARD_SLIDES[slide].icon}
                <p className="font-bold text-brand-dark text-lg mt-2">{DASHBOARD_SLIDES[slide].label}</p>
                <p className="text-sm text-brand-gray mt-1">{DASHBOARD_SLIDES[slide].desc}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setSlide((s) => (s - 1 + DASHBOARD_SLIDES.length) % DASHBOARD_SLIDES.length)}
                className="p-2 rounded-xl border border-gray-200 hover:border-primary transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setSlide((s) => (s + 1) % DASHBOARD_SLIDES.length)}
                className="p-2 rounded-xl border border-gray-200 hover:border-primary transition-colors">
                <ChevronRight size={16} />
              </button>
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
            <a href={`https://wa.me/${config.community_whatsapp}`} target="_blank" rel="noopener noreferrer"
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
              <h2 className="text-2xl font-bold text-brand-dark">@neofuture on Instagram</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {instagramPosts.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="aspect-square bg-gray-100 rounded-2xl overflow-hidden hover:opacity-90 transition-opacity flex items-center justify-center group relative">
                  <div className="text-center text-brand-gray p-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-xs font-bold">IG</span>
                    </div>
                    <p className="text-xs">View on Instagram</p>
                  </div>
                </a>
              ))}
            </div>
            {config.instagram_url && (
              <div className="text-center mt-6">
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
