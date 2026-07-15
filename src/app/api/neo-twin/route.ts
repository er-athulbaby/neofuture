import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { ensureWellnessTables } from '@/lib/neopulse'

interface Checkin {
  check_in_date: string
  sleep_score: number
  energy_score: number
  stress_level: number
  hydration_score: number | null
  mood_score: number | null
  wellness_score: string
  dow: string
}

function avg(arr: (number | null)[], key?: never): number {
  const vals = arr.filter((v): v is number => v != null)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function avgField(rows: Checkin[], field: keyof Checkin): number {
  const vals = rows.map((r) => Number(r[field])).filter((v) => !isNaN(v) && v > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function trendSlope(vals: number[]): number {
  if (vals.length < 2) return 0
  const n = vals.length
  const sumX = (n * (n - 1)) / 2
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  const sumY = vals.reduce((a, b) => a + b, 0)
  const sumXY = vals.reduce((a, b, i) => a + b * i, 0)
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
}

function scoreLabel(v: number): string {
  if (v >= 8.5) return 'Excellent'
  if (v >= 7) return 'Good'
  if (v >= 5.5) return 'Average'
  if (v >= 4) return 'Needs work'
  return 'Low'
}

function calcCycleDay(lastPeriodDate: string | null): { day: number | null; phase: string } {
  if (!lastPeriodDate) return { day: null, phase: '—' }
  const days = Math.floor((Date.now() - new Date(lastPeriodDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  const cycleDay = ((days - 1) % 28) + 1
  let phase = 'Luteal Phase'
  if (cycleDay <= 5) phase = 'Menstrual Phase'
  else if (cycleDay <= 13) phase = 'Follicular Phase'
  else if (cycleDay <= 16) phase = 'Ovulation Phase'
  return { day: cycleDay, phase }
}

function buildNeoTwinMessage(latest: Checkin, avg7: Record<string, number>): string {
  const sleep = Number(latest.sleep_score)
  const energy = Number(latest.energy_score)
  const stress = Number(latest.stress_level)
  const hydration = Number(latest.hydration_score ?? 5)
  const mood = Number(latest.mood_score ?? 7)

  if (stress >= 8) return `Your stress is quite high today (${stress}/10). Try a 5-minute breathing exercise before your next task. Your body is signalling it needs a moment of calm.`
  if (sleep <= 4) return `Rough night? Your sleep was ${sleep}/10. Prioritise rest today — even a 20-minute nap can help restore your energy levels.`
  if (energy >= 8 && mood >= 8) return `You're thriving today! Energy at ${energy}/10 and mood at ${mood}/10. This is a great time to tackle important goals.`
  if (hydration <= 4) return `Hydration is at ${hydration}/10 today. Make sure to drink water every hour — even mild dehydration affects energy and focus.`
  if (avg7.wellness >= 7.5) return `Your last 7-day wellness average is ${avg7.wellness.toFixed(1)}/10 — you're building a strong streak. Keep this momentum going!`
  if (energy <= 4) return `Energy is low today at ${energy}/10. Consider a short walk or light stretching — movement helps more than rest when energy dips.`
  return `You slept ${sleep}/10 and your energy is ${energy}/10 today. Stay hydrated and take short breaks to maintain your wellness score.`
}

function buildInsights(rows: Checkin[]): string[] {
  const insights: string[] = []
  if (rows.length < 7) return insights

  // Weekday stress analysis
  const dowStress: Record<string, number[]> = {}
  rows.forEach((r) => {
    const dow = new Date(r.check_in_date).toLocaleDateString('en-US', { weekday: 'long' })
    if (!dowStress[dow]) dowStress[dow] = []
    dowStress[dow].push(r.stress_level)
  })
  const dowAvg = Object.entries(dowStress)
    .map(([d, vals]) => ({ d, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .sort((a, b) => b.avg - a.avg)
  if (dowAvg.length > 0 && dowAvg[0].avg >= 6) {
    insights.push(`Your stress levels tend to be higher on ${dowAvg[0].d}s (avg ${dowAvg[0].avg.toFixed(1)}/10).`)
  }

  // Sleep → mood correlation
  const highSleepDays = rows.filter((r) => r.sleep_score >= 8 && r.mood_score != null)
  const lowSleepDays = rows.filter((r) => r.sleep_score <= 5 && r.mood_score != null)
  if (highSleepDays.length >= 3 && lowSleepDays.length >= 3) {
    const highMood = highSleepDays.reduce((s, r) => s + (r.mood_score ?? 0), 0) / highSleepDays.length
    const lowMood = lowSleepDays.reduce((s, r) => s + (r.mood_score ?? 0), 0) / lowSleepDays.length
    if (highMood - lowMood >= 1.5) {
      insights.push(`On days you sleep 8+ hours, your mood is ${highMood.toFixed(1)}/10 vs ${lowMood.toFixed(1)}/10 on poor sleep nights.`)
    }
  }

  // Energy trend
  if (rows.length >= 14) {
    const first7 = rows.slice(0, 7)
    const last7 = rows.slice(-7)
    const f7e = avgField(first7, 'energy_score')
    const l7e = avgField(last7, 'energy_score')
    if (l7e - f7e >= 1) insights.push(`Your energy has improved by ${(l7e - f7e).toFixed(1)} points over the past month.`)
    else if (f7e - l7e >= 1) insights.push(`Your energy has dipped by ${(f7e - l7e).toFixed(1)} points recently — check in with your rest and nutrition.`)
  }

  // Hydration consistency
  const hydRows = rows.filter((r) => r.hydration_score != null)
  if (hydRows.length >= 5) {
    const avgHyd = hydRows.reduce((s, r) => s + (r.hydration_score ?? 0), 0) / hydRows.length
    if (avgHyd < 5) insights.push(`Hydration averages ${avgHyd.toFixed(1)}/10 — drinking water consistently can boost your energy and mood significantly.`)
    else if (avgHyd >= 7.5) insights.push(`Excellent hydration habit — averaging ${avgHyd.toFixed(1)}/10. This directly supports your energy and skin health.`)
  }

  return insights.slice(0, 3)
}

function buildForecast(rows: Checkin[]): { label: string; description: string; trend: 'up' | 'down' | 'stable' } {
  if (rows.length < 5) return { label: 'Not enough data yet', description: 'Check in daily to unlock your personalised forecast.', trend: 'stable' }
  const recent = rows.slice(-7).map((r) => parseFloat(r.wellness_score))
  const slope = trendSlope(recent)
  if (slope >= 0.15) return { label: 'Rising wellness trend', description: 'Your wellness is improving! Keep up the good habits.', trend: 'up' }
  if (slope <= -0.15) return { label: 'Wellness dipping', description: 'Tomorrow may be lower-energy based on your recent pattern. Rest and hydrate well today.', trend: 'down' }
  return { label: 'Steady and stable', description: 'Your wellness is consistent. Small improvements in sleep or hydration will push you higher.', trend: 'stable' }
}

function buildMonthlyStory(rows: Checkin[], name: string): string {
  if (rows.length < 10) return `Dear ${name},\nYou're just getting started with your wellness journey. Check in daily to build insights and unlock your personalised monthly story.`
  const checkins = rows.length
  const avgW = avgField(rows, 'wellness_score' as keyof Checkin)
  const avgSleep = avgField(rows, 'sleep_score')
  const avgEnergy = avgField(rows, 'energy_score')
  const bestMetric = [
    { name: 'sleep', val: avgSleep },
    { name: 'energy', val: avgEnergy },
    { name: 'hydration', val: avgField(rows, 'hydration_score') },
    { name: 'mood', val: avgField(rows, 'mood_score') },
  ].sort((a, b) => b.val - a.val)[0]
  const weakest = [
    { name: 'sleep', val: avgSleep },
    { name: 'energy', val: avgEnergy },
    { name: 'hydration', val: avgField(rows, 'hydration_score') },
    { name: 'stress management', val: 11 - avgField(rows, 'stress_level') },
  ].sort((a, b) => a.val - b.val)[0]

  return `Dear ${name},\nYou completed ${checkins} wellness check-ins this month. Your average wellness score is ${avgW.toFixed(1)}/10.\n\nYour strongest habit was ${bestMetric.name} (${bestMetric.val.toFixed(1)}/10). One area to focus on next month: ${weakest.name}.\n\nYou're making steady progress — keep showing up for yourself every day.\n\n- Your Neo Twin`
}

function calcWellnessAge(actualAge: number, cur: Record<string, number>): number {
  let adj = 0

  // Sleep (ideal 8+)
  if (cur.sleep >= 8) adj -= 1.5
  else if (cur.sleep >= 7) adj -= 0.5
  else if (cur.sleep > 0 && cur.sleep < 5) adj += 2
  else if (cur.sleep > 0 && cur.sleep < 6) adj += 1

  // Energy (ideal 8+)
  if (cur.energy >= 8) adj -= 1
  else if (cur.energy >= 7) adj -= 0.5
  else if (cur.energy > 0 && cur.energy < 5) adj += 1.5
  else if (cur.energy > 0 && cur.energy < 6) adj += 0.5

  // Stress (lower is better; ideal <= 3)
  if (cur.stress <= 3) adj -= 1.5
  else if (cur.stress <= 5) adj -= 0.5
  else if (cur.stress >= 8) adj += 2
  else if (cur.stress >= 7) adj += 1

  // Hydration (ideal 7.5+)
  if (cur.hydration >= 7.5) adj -= 0.5
  else if (cur.hydration > 0 && cur.hydration < 5) adj += 1

  // Mood (ideal 7.5+)
  if (cur.mood >= 7.5) adj -= 0.5
  else if (cur.mood > 0 && cur.mood < 5) adj += 0.5

  return Math.max(18, Math.round(actualAge + adj))
}

function buildAchievements(rows: Checkin[], totalCheckins: number): { label: string; icon: string; earned: boolean }[] {
  const avgSleep7 = rows.slice(-7).length >= 7 ? avgField(rows.slice(-7), 'sleep_score') : 0
  const avgHyd7 = rows.slice(-7).filter((r) => r.hydration_score != null).length >= 5
    ? rows.slice(-7).reduce((s, r) => s + (r.hydration_score ?? 0), 0) / rows.slice(-7).length
    : 0

  return [
    { label: '30 Check-ins', icon: '🔥', earned: totalCheckins >= 30 },
    { label: 'Hydration Hero', icon: '💧', earned: avgHyd7 >= 7 },
    { label: 'Sleep Star', icon: '🌙', earned: avgSleep7 >= 7.5 },
    { label: '7-Day Streak', icon: '⚡', earned: rows.filter((r) => {
      const d = new Date(r.check_in_date)
      const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
      return daysAgo < 7
    }).length >= 7 },
    { label: 'Wellness Champion', icon: '🏆', earned: avgField(rows.slice(-14), 'wellness_score' as keyof Checkin) >= 7.5 },
  ]
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureWellnessTables()

  const userId = String(session.user.id)
  const isAdmin = session.user.is_admin === true

  // Total check-in count (unlock threshold: 30)
  const countRow = await queryOne<{ total: string }>(
    `SELECT COUNT(*)::text as total FROM wellness_checkins WHERE user_id = $1`,
    [userId]
  ).catch(() => null)
  const totalCheckins = parseInt(countRow?.total ?? '0')
  const unlocked = totalCheckins >= 30

  // Admins bypass the 30 check-in requirement
  if (!isAdmin && !unlocked) {
    return NextResponse.json({ unlocked: false, total_checkins: totalCheckins, needed: 30 - totalCheckins })
  }

  // Last 30 days check-ins
  const rows = await query<Checkin>(
    `SELECT check_in_date, sleep_score, energy_score, stress_level, hydration_score, mood_score, wellness_score,
       EXTRACT(DOW FROM check_in_date)::text as dow
     FROM wellness_checkins WHERE user_id = $1 AND check_in_date >= CURRENT_DATE - 30
     ORDER BY check_in_date ASC`,
    [userId]
  ).catch(() => [] as Checkin[])

  // Previous 30 days (for timeline comparison)
  const prevRows = await query<Checkin>(
    `SELECT check_in_date, sleep_score, energy_score, stress_level, hydration_score, mood_score, wellness_score,
       EXTRACT(DOW FROM check_in_date)::text as dow
     FROM wellness_checkins WHERE user_id = $1 AND check_in_date < CURRENT_DATE - 30 AND check_in_date >= CURRENT_DATE - 60
     ORDER BY check_in_date ASC`,
    [userId]
  ).catch(() => [] as Checkin[])

  // All check-ins for insights
  const allRows = await query<Checkin>(
    `SELECT check_in_date, sleep_score, energy_score, stress_level, hydration_score, mood_score, wellness_score,
       EXTRACT(DOW FROM check_in_date)::text as dow
     FROM wellness_checkins WHERE user_id = $1 ORDER BY check_in_date ASC`,
    [userId]
  ).catch(() => [] as Checkin[])

  // Health profile
  const profile = await queryOne<{
    height_cm: number | null; weight_kg: number | null; date_of_birth: string | null; last_period_date: string | null
  }>(
    `SELECT height_cm, weight_kg, date_of_birth, last_period_date FROM user_health_profiles WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
    [userId]
  ).catch(() => null)

  // NP balance
  const npRow = await queryOne<{ neopulse_balance: number; referral_code: string | null }>(
    `SELECT neopulse_balance, referral_code FROM users WHERE id = $1`,
    [userId]
  ).catch(() => null)

  const latest = rows.length ? rows[rows.length - 1] : null
  const cycle = calcCycleDay(profile?.last_period_date ?? null)

  // Current 30-day averages
  const cur = {
    sleep: avgField(rows, 'sleep_score'),
    energy: avgField(rows, 'energy_score'),
    stress: avgField(rows, 'stress_level'),
    hydration: avgField(rows.filter((r) => r.hydration_score != null), 'hydration_score'),
    mood: avgField(rows.filter((r) => r.mood_score != null), 'mood_score'),
    wellness: avgField(rows, 'wellness_score' as keyof Checkin),
  }

  // Previous 30-day averages (for timeline %)
  const prev = {
    sleep: avgField(prevRows, 'sleep_score'),
    energy: avgField(prevRows, 'energy_score'),
    stress: avgField(prevRows, 'stress_level'),
    hydration: avgField(prevRows.filter((r) => r.hydration_score != null), 'hydration_score'),
    mood: avgField(prevRows.filter((r) => r.mood_score != null), 'mood_score'),
    wellness: avgField(prevRows, 'wellness_score' as keyof Checkin),
  }

  function pctChange(cur: number, prev: number): number | null {
    if (!prev) return null
    return Math.round(((cur - prev) / prev) * 100)
  }

  const last7 = rows.slice(-7)

  // Strengths and growth opportunities
  const strengths: string[] = []
  const opportunities: string[] = []
  if (cur.sleep >= 7) strengths.push('Good sleep routine')
  else if (cur.sleep < 6) opportunities.push('Improve sleep consistency')
  if (cur.energy >= 7) strengths.push('Strong energy levels')
  else if (cur.energy < 5.5) opportunities.push('Boost daily energy')
  if (cur.hydration >= 7) strengths.push('Consistent hydration')
  else if (cur.hydration > 0 && cur.hydration < 6) opportunities.push('Increase water intake')
  if (cur.mood >= 7) strengths.push('Positive mood pattern')
  else if (cur.mood > 0 && cur.mood < 5.5) opportunities.push('Mood support & self-care')
  if (cur.stress <= 4) strengths.push('Excellent stress management')
  else if (cur.stress >= 7) opportunities.push('Reduce stress levels')
  if (opportunities.length === 0) opportunities.push('Maintain your current habits')

  // Neo Twin says
  const avg7 = {
    wellness: last7.length ? avgField(last7, 'wellness_score' as keyof Checkin) : cur.wellness,
  }
  const neoTwinMessage = latest
    ? buildNeoTwinMessage(latest, avg7)
    : isAdmin
      ? 'As admin, you have full access to Neo Twin. Start daily check-ins to build your personalised wellness insights!'
      : 'Check in daily to get your personalised insights!'

  // Body pattern insights
  const insights = buildInsights(allRows)

  // Forecast
  const forecast = buildForecast(allRows)

  // Monthly story
  const name = session.user.name?.split(' ')[0] ?? 'Friend'
  const monthlyStory = buildMonthlyStory(rows, name)

  // Achievements
  const achievements = buildAchievements(allRows, totalCheckins)

  // 30-day challenges (static for now, based on weakest metrics)
  const challenges: { icon: string; label: string; progress: number }[] = []
  if (cur.hydration < 7 || cur.hydration === 0) challenges.push({ icon: '💧', label: 'Drink 2L water daily', progress: 0 })
  if (cur.energy < 7) challenges.push({ icon: '🚶', label: 'Walk 15 mins daily', progress: 0 })
  if (cur.sleep < 7.5) challenges.push({ icon: '🌙', label: 'Sleep before 11 PM', progress: 0 })
  if (challenges.length < 3) challenges.push({ icon: '🧘', label: 'Meditate 10 mins', progress: 0 })
  if (challenges.length < 3) challenges.push({ icon: '🥗', label: 'Eat iron-rich meals', progress: 0 })

  // Wellness age
  let actualAge: number | null = null
  let wellnessAge: number | null = null
  if (profile?.date_of_birth) {
    actualAge = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    wellnessAge = calcWellnessAge(actualAge, cur)
  }

  return NextResponse.json({
    unlocked: true,
    is_admin_preview: isAdmin && !unlocked,
    total_checkins: totalCheckins,
    name,
    latest,
    health: profile ?? null,
    actual_age: actualAge,
    wellness_age: wellnessAge,
    cycle,
    np_balance: npRow?.neopulse_balance ?? 0,
    streak: Math.min(totalCheckins, 30),
    cur,
    prev,
    timeline: {
      sleep: pctChange(cur.sleep, prev.sleep),
      energy: pctChange(cur.energy, prev.energy),
      stress: pctChange(11 - cur.stress, 11 - prev.stress),
      hydration: pctChange(cur.hydration, prev.hydration),
      mood: pctChange(cur.mood, prev.mood),
    },
    neo_twin_message: neoTwinMessage,
    insights,
    strengths: strengths.slice(0, 3),
    opportunities: opportunities.slice(0, 3),
    forecast,
    monthly_story: monthlyStory,
    achievements,
    challenges: challenges.slice(0, 3),
    history: rows,
  })
}
