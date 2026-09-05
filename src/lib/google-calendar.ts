import { google } from 'googleapis'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  )
}

export function getAuthUrl(doctorId: string | number): string {
  const oauth2 = getOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: String(doctorId),
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2 = getOAuth2Client()
  const { tokens } = await oauth2.getToken(code)
  return tokens
}

export async function createMeetingEvent(
  refreshToken: string,
  opts: {
    title: string
    startTime: string
    endTime: string
    patientEmail: string
    doctorEmail: string
    description?: string
  }
): Promise<{ eventId: string; meetLink: string }> {
  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({ refresh_token: refreshToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2 })

  const res = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: opts.title,
      description: opts.description,
      start: { dateTime: opts.startTime, timeZone: 'Asia/Kolkata' },
      end: { dateTime: opts.endTime, timeZone: 'Asia/Kolkata' },
      attendees: [{ email: opts.patientEmail }, { email: opts.doctorEmail }],
      conferenceData: {
        createRequest: {
          requestId: `neofuture-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const event = res.data
  const meetLink = event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri ?? ''

  return { eventId: event.id!, meetLink }
}

export async function deleteMeetingEvent(refreshToken: string, eventId: string): Promise<void> {
  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2 })
  await calendar.events.delete({ calendarId: 'primary', eventId })
}
