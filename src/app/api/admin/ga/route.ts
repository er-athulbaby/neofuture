import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { google } from 'googleapis'

function getClient() {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL
  const key = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) return null
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
}

function val(row: { metricValues?: Array<{ value?: string | null }> | null } | null | undefined, idx: number): number {
  return Number(row?.metricValues?.[idx]?.value ?? 0)
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const authClient = getClient()
  const propertyId = process.env.GA_PROPERTY_ID

  if (!authClient || !propertyId) {
    return NextResponse.json({ configured: false })
  }

  try {
    const ga = google.analyticsdata({ version: 'v1beta', auth: authClient })
    const prop = `properties/${propertyId}`

    const [todayRes, weekRes, monthRes, trendRes, pagesRes, sourcesRes, devicesRes] = await Promise.all([
      // Today
      ga.properties.runReport({
        property: prop,
        requestBody: {
          dateRanges: [{ startDate: 'today', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        },
      }),
      // Last 7 days
      ga.properties.runReport({
        property: prop,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        },
      }),
      // Last 30 days — summary
      ga.properties.runReport({
        property: prop,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'activeUsers' }, { name: 'newUsers' },
            { name: 'sessions' }, { name: 'screenPageViews' },
            { name: 'bounceRate' }, { name: 'averageSessionDuration' },
          ],
        },
      }),
      // Daily trend (30d)
      ga.properties.runReport({
        property: prop,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
      }),
      // Top pages
      ga.properties.runReport({
        property: prop,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '10',
        },
      }),
      // Traffic sources
      ga.properties.runReport({
        property: prop,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '8',
        },
      }),
      // Devices
      ga.properties.runReport({
        property: prop,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
        },
      }),
    ])

    const todayRow = todayRes.data.rows?.[0]
    const weekRow = weekRes.data.rows?.[0]
    const monthRow = monthRes.data.rows?.[0]

    return NextResponse.json({
      configured: true,
      today: {
        users: val(todayRow, 0),
        sessions: val(todayRow, 1),
        pageViews: val(todayRow, 2),
      },
      week: {
        users: val(weekRow, 0),
        sessions: val(weekRow, 1),
        pageViews: val(weekRow, 2),
      },
      month: {
        users: val(monthRow, 0),
        newUsers: val(monthRow, 1),
        sessions: val(monthRow, 2),
        pageViews: val(monthRow, 3),
        bounceRate: Number((val(monthRow, 4) * 100).toFixed(1)),
        avgDuration: Math.round(val(monthRow, 5)),
      },
      trend: (trendRes.data.rows ?? []).map((r) => ({
        date: r.dimensionValues?.[0]?.value ?? '',
        users: val(r, 0),
        sessions: val(r, 1),
        pageViews: val(r, 2),
      })),
      topPages: (pagesRes.data.rows ?? []).map((r) => ({
        path: r.dimensionValues?.[0]?.value ?? '',
        views: val(r, 0),
        users: val(r, 1),
      })),
      sources: (sourcesRes.data.rows ?? []).map((r) => ({
        channel: r.dimensionValues?.[0]?.value ?? '',
        sessions: val(r, 0),
        users: val(r, 1),
      })),
      devices: (devicesRes.data.rows ?? []).map((r) => ({
        device: r.dimensionValues?.[0]?.value ?? '',
        sessions: val(r, 0),
      })),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'GA API error'
    return NextResponse.json({ configured: true, error: msg }, { status: 500 })
  }
}
