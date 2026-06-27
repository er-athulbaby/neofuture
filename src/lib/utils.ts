import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `NEO-${ts}-${rand}`
}

export function getScoreLabel(score: number, type: 'hormone' | 'stress' | 'energy') {
  if (type === 'hormone') {
    if (score <= 25) return { label: 'Good Hormonal Wellness', color: 'green' }
    if (score <= 50) return { label: 'Moderate Attention Needed', color: 'yellow' }
    if (score <= 75) return { label: 'High Hormonal Support Needed', color: 'orange' }
    return { label: 'Strong Focus Recommended', color: 'red' }
  }
  if (type === 'stress') {
    if (score <= 30) return { label: 'Low Stress Risk', color: 'green' }
    if (score <= 50) return { label: 'Moderate Stress', color: 'yellow' }
    if (score <= 75) return { label: 'High Stress', color: 'orange' }
    return { label: 'Strong Recovery Support Needed', color: 'red' }
  }
  // energy
  if (score <= 25) return { label: 'Great Energy Levels', color: 'green' }
  if (score <= 50) return { label: 'Mild Energy Dip', color: 'yellow' }
  if (score <= 75) return { label: 'Low Energy', color: 'orange' }
  return { label: 'Significant Energy Support Needed', color: 'red' }
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function dateDiffInDays(a: Date, b: Date) {
  const ms = Math.abs(b.getTime() - a.getTime())
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function getGestationalAge(lmp: Date) {
  const days = dateDiffInDays(lmp, new Date())
  const weeks = Math.floor(days / 7)
  const remDays = days % 7
  return { weeks, days: remDays, total: days }
}

export function getTrimester(weeks: number) {
  if (weeks < 13) return 1
  if (weeks < 27) return 2
  return 3
}
