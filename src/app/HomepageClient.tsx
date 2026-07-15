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
  { href: '/tools/vaccination', icon: <Baby size={22} className="text-neo-orange" />, title: 'Vaccination Schedule', desc: 'India NIP â€” 30+ vaccines with checkoff' },
  { href: '/tools/growth-chart', icon: <Activity size={22} className="text-neo-purple" />, title: 'Baby Growth Chart', desc: 'WHO percentile chart for 0â€“24 months' },
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

      {/* â”€â”€ HERO â”€â”€ */}
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

      {/* â”€â”€ TRUST BAR â”€â”€ */}
      <div className="bg-brand-dark text-white py-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 md:gap-10 text-sm">
          {[
            { icon: <ShieldCheck size={15} />, text: '100% Natural Ingredients' },
            { icon: <Truck size={15} />, text: 'Free Shipping Above â‚¹999' },
            { icon: <Stethoscope size={15} />, text: 'Doctor Recommended' },
            { icon: <RefreshCw size={15} />, text: 'Easy Returns' },
          ].map((t) => (
            <span key={t.text} className="flex items-center gap-2 text-gray-300">{t.icon} {t.text}</span>
          ))}
        </div>
      </div>

      {/* â”€â”€ AI WELLNESS DASHBOARD â”€â”€ */}
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
                    <p className="text-sm font-bold text-brand-dark">Jul 18 â€“ Jul 23</p>
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
              AI-Powered âœ¦
            </div>
          </div>
        </div>
      </section>


      {/* â”€â”€ PERIOD CALENDAR CTA â”€â”€ */}
      <section className="py-20 px-4 bg-brand-dark">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Calendar table mockup */}
          <div className="flex justify-center">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm">
              {/* Calendar header */}
              <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-5">
                <p className="text-sm font-medium opacity-80">NeoFuture Period Tracker</p>
                <p className="text-2xl font-bold mt-1">July 2025</p>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white inline-block" /> Period</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-300 inline-block" /> Ovulation</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/30 inline-block" /> Fertile</span>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="p-4">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-bold text-brand-gray py-1">{d}</div>
                  ))}
                </div>

                {/* Days â€” July 2025 starts on Tuesday (index 2) */}
                {(() => {
                  const days = [
                    { d: null }, { d: null },
                    { d: 1 }, { d: 2 }, { d: 3 }, { d: 4 }, { d: 5 },
                    { d: 6 }, { d: 7 }, { d: 8 }, { d: 9 }, { d: 10 }, { d: 11 }, { d: 12 },
                    { d: 13 }, { d: 14 }, { d: 15 }, { d: 16 }, { d: 17 }, { d: 18 }, { d: 19 },
                    { d: 20 }, { d: 21 }, { d: 22 }, { d: 23 }, { d: 24 }, { d: 25 }, { d: 26 },
                    { d: 27 }, { d: 28 }, { d: 29 }, { d: 30 }, { d: 31 }, { d: null }, { d: null },
                  ]
                  // Period: 1-5, Fertile: 9-14, Ovulation: 14, Predicted: 29-31
                  const period = [1,2,3,4,5]
                  const fertile = [9,10,11,12,13]
                  const ovulation = [14]
                  const predicted = [29,30,31]
                  return (
                    <div className="grid grid-cols-7 gap-0.5">
                      {days.map((cell, i) => {
                        if (!cell.d) return <div key={i} />
                        const d = cell.d
                        const isPeriod = period.includes(d)
                        const isFertile = fertile.includes(d)
                        const isOvulation = ovulation.includes(d)
                        const isPredict = predicted.includes(d)
                        const isToday = d === 28
                        return (
                          <div key={i} className={
                            `aspect-square flex items-center justify-center text-xs font-semibold rounded-lg ` +
                            (isPeriod ? 'bg-primary text-white' :
                             isOvulation ? 'bg-purple-600 text-white' :
                             isFertile ? 'bg-purple-100 text-purple-700' :
                             isPredict ? 'bg-primary/20 text-primary' :
                             isToday ? 'ring-2 ring-primary text-primary' :
                             'text-brand-dark')
                          }>
                            {d}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Next period strip */}
                <div className="mt-4 bg-primary-light rounded-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-brand-gray">Next Period</p>
                    <p className="text-sm font-bold text-brand-dark">Jul 29 â€“ Aug 3</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-gray">Ovulation</p>
                    <p className="text-sm font-bold text-purple-600">Jul 14</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text + CTA */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">AI-Powered Cycle Tracking</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              AI-Based Period Tracking.<br />Know Your Body Better.
            </h2>
            <p className="text-white/70 leading-relaxed mb-6">
              Log your periods and let NeoFuture AI predict your next cycle, ovulation window, and fertile days â€” all in one beautiful calendar. Get personalised insights built around your unique rhythm.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { icon: 'ðŸ©¸', text: 'Period predictions based on your actual history' },
                { icon: 'ðŸŸ£', text: 'Ovulation & fertile window highlighted automatically' },
                { icon: 'ðŸ””', text: 'Reminders before your period starts' },
                { icon: 'ðŸ“Š', text: 'Cycle trends and average length over time' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-white/80 text-sm">{f.text}</span>
                </div>
              ))}
            </div>

            {session ? (
              <Link href="/account/period-calendar"
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
                Open My Period Calendar <ArrowRight size={18} />
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
                  Login to Track Your Period <ArrowRight size={18} />
                </Link>
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-6 py-4 rounded-xl font-semibold text-base hover:bg-white/10 transition-colors">
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* â”€â”€ COMMUNITY â”€â”€ */}
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

      {/* â”€â”€ ABOUT US â”€â”€ */}
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
                  <p className="text-sm">Add your team photo in<br/>Admin â†’ Settings</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* â”€â”€ FOUNDERS â”€â”€ */}
      {(config.founder1_name || config.founder2_name) && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Leadership</span>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">Meet Our Founders</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  name: config.founder1_name,
                  title: config.founder1_title,
                  bio: config.founder1_bio,
                  image: config.founder1_image,
                  accent: 'from-primary/10 to-primary/5',
                  border: 'border-primary/20',
                  ring: 'ring-primary/30',
                  initials: config.founder1_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2),
                },
                {
                  name: config.founder2_name,
                  title: config.founder2_title,
                  bio: config.founder2_bio,
                  image: config.founder2_image,
                  accent: 'from-neo-purple/10 to-neo-purple/5',
                  border: 'border-neo-purple/20',
                  ring: 'ring-neo-purple/30',
                  initials: config.founder2_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2),
                },
              ].filter((f) => f.name).map((founder, i) => (
                <div key={i} className={`bg-gradient-to-br ${founder.accent} border ${founder.border} rounded-3xl p-8`}>
                  <div className="flex items-start gap-5">
                    {/* Photo / Avatar */}
                    <FounderAvatar
                      image={founder.image}
                      name={founder.name}
                      initials={founder.initials}
                      ring={founder.ring}
                      colorClass={i === 0 ? 'bg-gradient-to-br from-primary to-primary-dark' : 'bg-gradient-to-br from-neo-purple to-purple-700'}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-brand-dark leading-tight">{founder.name}</h3>
                      <p className={`text-sm font-semibold mt-1 mb-3 ${i === 0 ? 'text-primary' : 'text-neo-purple'}`}>{founder.title}</p>
                      <p className="text-brand-gray text-sm leading-relaxed">{founder.bio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* â”€â”€ NUTRACEUTICAL INTRO â”€â”€ */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-dark via-[#2a1a4a] to-[#1a1535] overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-neo-purple/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/15 px-3 py-1.5 rounded-full mb-5">
                Nutraceuticals
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
                The Future of Women's Wellness{' '}
                <span className="text-primary">Begins Before Illness.</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-4">
                Your wellness isn't just about treating problems â€” it's about caring for yourself every day.
              </p>
              <p className="text-white/55 leading-relaxed mb-8">
                Nutraceuticals are scientifically formulated wellness products made from vitamins, minerals, botanical extracts, and other bioactive ingredients that help support the body's natural functions and overall wellness. At NeoFuture, our doctor-informed formulations are developed using high-quality ingredients and manufactured under strict quality standards. When taken daily as directed, nutraceuticals are generally safe for most healthy adults and help maintain energy, hormonal balance, immunity, stress management, sleep quality, and metabolic health. They work by providing essential nutrients that complement a balanced diet and healthy lifestyle. Every NeoFuture product also connects with NeoFuture AI for personalized wellness tracking and health insights.
              </p>
              <Link href="/shop"
                className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                Explore Nutraceuticals <ArrowRight size={16} />
              </Link>
            </div>

            {/* Stat cards */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-4 w-full max-w-xs lg:max-w-none lg:w-72">
              {[
                { label: 'Natural Balance', icon: 'ðŸŒ¿', desc: 'Hormone & gut harmony' },
                { label: 'Daily Energy', icon: 'âš¡', desc: 'Sustained vitality' },
                { label: 'Better Sleep', icon: 'ðŸŒ™', desc: 'Restorative rest' },
                { label: 'Overall Wellbeing', icon: 'ðŸ’—', desc: 'Body & mind care' },
              ].map((s) => (
                <div key={s.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-white font-semibold text-sm">{s.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ PRODUCTS â”€â”€ */}
      <section id="products" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Our Products</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">Nutraceuticals</h2>
            <p className="text-brand-gray">Science-backed nutritional support trusted by women across India</p>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-brand-gray">
              <p className="font-medium mb-1">No products added yet</p>
              <Link href="/admin/products" className="text-primary text-sm hover:underline">Add products in Admin Panel â†’</Link>
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/shop" className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary-light transition-colors">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ TOOLS â”€â”€ */}
      <section id="tools" className="py-20 px-4 bg-brand-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Free Tools</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">Wellness Calculators</h2>
            <p className="text-brand-gray">Free with a NeoFuture account â€” no subscription needed</p>
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
                Create Free Account â†’
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ INSTAGRAM FEED â”€â”€ */}
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

function FounderAvatar({ image, name, initials, ring, colorClass }: {
  image: string; name: string; initials: string; ring: string; colorClass: string
}) {
  const [broken, setBroken] = useState(false)
  const showFallback = !image?.trim() || broken

  return (
    <div className="flex-shrink-0">
      {!showFallback ? (
        <img
          src={image}
          alt={name}
          onError={() => setBroken(true)}
          className={`w-24 h-24 rounded-2xl object-cover shadow-lg ring-4 ${ring}`}
        />
      ) : (
        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ${ring} ${colorClass}`}>
          {initials}
        </div>
      )}
    </div>
  )
}
