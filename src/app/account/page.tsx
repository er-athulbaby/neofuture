import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import Link from 'next/link'
import { formatDate, getScoreLabel } from '@/lib/utils'
import { Sparkles, ShoppingBag, Calendar, Baby, Scale, Utensils, BarChart3, Droplets, ArrowRight } from 'lucide-react'
import AccountPeriodWidget from './AccountPeriodWidget'

export const metadata = { title: 'My Dashboard' }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [latestScore, recentOrders, latestQuiz] = await Promise.all([
    queryOne<{ hormone_score: number; stress_score: number; energy_score: number; created_at: string }>(
      'SELECT hormone_score, stress_score, energy_score, created_at FROM wellness_scores WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [session.user.id]
    ).catch(() => null),
    query<{ id: number; order_number: string; total: number; status: string; created_at: string }>(
      'SELECT id, order_number, total, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3',
      [session.user.id]
    ).catch(() => []),
    queryOne<{ quiz_path: string; recommended_product_id: number; created_at: string }>(
      'SELECT quiz_path, recommended_product_id, created_at FROM quiz_sessions WHERE user_id = $1 AND completed = true ORDER BY created_at DESC LIMIT 1',
      [session.user.id]
    ).catch(() => null),
  ])

  const tools = [
    { href: '/tools/due-date', icon: Calendar, title: 'Due Date Calculator', color: 'primary' },
    { href: '/tools/vaccination', icon: Baby, title: 'Vaccination Schedule', color: 'neo-orange' },
    { href: '/tools/growth-chart', icon: BarChart3, title: 'Baby Growth Chart', color: 'neo-purple' },
    { href: '/tools/weight-gain', icon: Scale, title: 'Weight Gain Calculator', color: 'primary' },
    { href: '/tools/baby-food', icon: Utensils, title: 'Baby Food Chart', color: 'neo-orange' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
          {session.user.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Hello, {session.user.name?.split(' ')[0]}!</h1>
          <p className="text-brand-gray text-sm">Your AI Wellness Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Wellness scores */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-dark flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Wellness Scores
              </h2>
              {latestScore && (
                <span className="text-xs text-brand-gray">Last updated {formatDate(latestScore.created_at)}</span>
              )}
            </div>
            {latestScore ? (
              <div className="space-y-4">
                {latestScore.hormone_score > 0 && <ScoreRow label="Hormone Score" score={latestScore.hormone_score} type="hormone" />}
                {latestScore.stress_score > 0 && <ScoreRow label="Stress Score" score={latestScore.stress_score} type="stress" />}
                {latestScore.energy_score > 0 && <ScoreRow label="Energy Score" score={latestScore.energy_score} type="energy" />}
              </div>
            ) : (
              <div className="text-center py-6">
                <Sparkles size={32} className="mx-auto text-primary/30 mb-3" />
                <p className="text-brand-gray text-sm mb-3">Take the wellness quiz to see your scores</p>
                <Link href="/" className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
                  Take Quiz
                </Link>
              </div>
            )}
          </div>

          {/* Period Calendar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-dark flex items-center gap-2">
                <Droplets size={18} className="text-primary" /> Period Tracker
              </h2>
              <Link href="/account/period-calendar" className="text-sm text-primary hover:underline flex items-center gap-1">
                Full view <ArrowRight size={13} />
              </Link>
            </div>
            <AccountPeriodWidget />
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-dark flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" /> Recent Orders
              </h2>
              <Link href="/account/orders" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-brand-dark">{order.order_number}</p>
                      <p className="text-xs text-brand-gray">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-dark">₹{order.total}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-success' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-danger' :
                        'bg-yellow-100 text-warning'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-brand-gray">
                <ShoppingBag size={32} className="mx-auto opacity-30 mb-3" />
                <p className="text-sm mb-3">No orders yet</p>
                <Link href="/shop" className="text-primary text-sm font-medium hover:underline">Start Shopping →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick tools */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-brand-dark mb-4">Wellness Tools</h2>
            <div className="space-y-2">
              {tools.map((tool) => {
                const Icon = tool.icon
                const colors: Record<string, string> = {
                  primary: 'bg-primary-light text-primary',
                  'neo-orange': 'bg-neo-orange-light text-neo-orange',
                  'neo-purple': 'bg-neo-purple-light text-neo-purple',
                }
                return (
                  <Link key={tool.href} href={tool.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg ${colors[tool.color]} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-brand-dark group-hover:text-primary transition-colors">{tool.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreRow({ label, score, type }: { label: string; score: number; type: 'hormone' | 'stress' | 'energy' }) {
  const { label: interpretation, color } = getScoreLabel(score, type)
  const barColors: Record<string, string> = {
    green: 'bg-success', yellow: 'bg-warning', orange: 'bg-neo-orange', red: 'bg-danger'
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-brand-dark">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold text-brand-dark">{score}/100</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-brand-gray">{interpretation}</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${barColors[color]}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
