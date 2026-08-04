// Simple in-memory rate limiter — suitable for single-instance EC2 deployments.
// Uses a sliding window per identifier (IP or user ID).

interface Window { count: number; resetAt: number }

const store = new Map<string, Window>()

// Prune stale entries every 5 minutes to avoid memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of store.entries()) {
    if (win.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Returns true if the request should be blocked.
 * @param key    Unique identifier — IP address or user ID
 * @param limit  Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const win = store.get(key)

  if (!win || win.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  win.count += 1
  if (win.count > limit) return true
  return false
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
  })
}
