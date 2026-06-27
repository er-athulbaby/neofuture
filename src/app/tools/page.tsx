import Link from 'next/link'
import { Calendar, Baby, BarChart3, Utensils, Scale, Lock } from 'lucide-react'

export const metadata = { title: 'Free Wellness Tools' }

const tools = [
  { href: '/tools/due-date', icon: Calendar, title: 'Due Date Calculator', desc: 'Calculate your estimated due date using LMP, conception date, or IVF transfer date. Includes gestational age and trimester info.', color: 'primary', tag: 'Pregnancy' },
  { href: '/tools/weight-gain', icon: Scale, title: 'Pregnancy Weight Gain Calculator', desc: 'Check if your weight gain is on track based on your pre-pregnancy BMI and current week of pregnancy.', color: 'neo-orange', tag: 'Pregnancy' },
  { href: '/tools/vaccination', icon: Baby, title: 'Vaccination Schedule', desc: 'India NIP vaccination schedule for your baby. Enter your baby\'s birth date and track each vaccine with reminders.', color: 'neo-purple', tag: 'Baby Care' },
  { href: '/tools/growth-chart', icon: BarChart3, title: 'Baby Growth Chart', desc: 'Plot your baby\'s weight, height, and head circumference against WHO growth standards. See percentile rankings.', color: 'primary', tag: 'Baby Care' },
  { href: '/tools/baby-food', icon: Utensils, title: 'Baby Food Chart', desc: 'Age-appropriate Indian foods for your baby — from 6 months to 2 years. With allergen warnings and foods to avoid.', color: 'neo-orange', tag: 'Baby Care' },
]

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary bg-primary-light px-3 py-1 rounded-full mb-4">
          Free with account
        </span>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Wellness Tools & Calculators</h1>
        <p className="text-brand-gray max-w-xl mx-auto">
          Science-backed tools for every stage of your journey. All free — just create an account to access and save your results.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-brand-gray">
          <Lock size={14} className="text-primary" />
          Sign in or create a free account to use all tools
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {tools.map((tool) => {
          const Icon = tool.icon
          const colors: Record<string, { bg: string; text: string; border: string }> = {
            primary: { bg: 'bg-primary-light', text: 'text-primary', border: 'hover:border-primary' },
            'neo-orange': { bg: 'bg-neo-orange-light', text: 'text-neo-orange', border: 'hover:border-neo-orange' },
            'neo-purple': { bg: 'bg-neo-purple-light', text: 'text-neo-purple', border: 'hover:border-neo-purple' },
          }
          const c = colors[tool.color]
          return (
            <Link key={tool.href} href={tool.href}
              className={`tool-card bg-white border-2 border-gray-100 ${c.border} rounded-2xl p-6 block`}>
              <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={c.text} size={24} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{tool.tag}</span>
              <h2 className="font-bold text-brand-dark text-lg mt-1 mb-2">{tool.title}</h2>
              <p className="text-sm text-brand-gray leading-relaxed">{tool.desc}</p>
              <div className={`mt-4 text-sm font-semibold ${c.text} flex items-center gap-1`}>
                Open Tool →
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
