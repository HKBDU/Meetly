import { invalidateGoogleToken, requestGoogleAccessToken } from '@/lib/google'
import { calendarOccurrenceDate, calendarRecurrence } from '@/shared/lib/calendar'
import type { EventDetail, FinalSchedule } from '@/shared/types'

const MEET_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const FIELDS = 'hangoutLink,conferenceData(createRequest(status),entryPoints(entryPointType,uri))'
const MEET_URL = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/

interface ConferenceResponse {
  hangoutLink?: string
  conferenceData?: {
    createRequest?: { status?: { statusCode?: string } }
    entryPoints?: { entryPointType: string; uri: string }[]
  }
}

export async function createGoogleMeet(
  event: Pick<EventDetail, 'title' | 'url' | 'timezone'>,
  schedule: FinalSchedule,
): Promise<string> {
  const date = calendarOccurrenceDate(schedule, event.timezone)
  if (!date) throw new Error('Missing calendar occurrence.')
  const accessToken = await requestGoogleAccessToken(MEET_SCOPE)
  invalidateGoogleToken(MEET_SCOPE)
  const time = (value: string) => value.length === 5 ? `${value}:00` : value

  // The same slot can be retried after Google creates the event but the finalize request fails.
  const key = JSON.stringify([event.url, event.timezone, schedule.specificDate, schedule.dayOfWeek, time(schedule.startTime), time(schedule.endTime)])
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))
  const id = Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('')
  const recurrence = calendarRecurrence(schedule)
  const dateTime = (value: string) => ({ dateTime: `${date}T${time(value)}`, timeZone: event.timezone })
  const headers = { Authorization: `Bearer ${accessToken}` }
  const signal = AbortSignal.timeout(12_000)
  const fields = new URLSearchParams({ fields: FIELDS })
  const getEvent = () => fetch(`${EVENTS_URL}/${id}?${fields}`, { headers, signal })
  let response = await fetch(`${EVENTS_URL}?conferenceDataVersion=1&${fields}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      id,
      summary: event.title,
      description: event.url,
      start: dateTime(schedule.startTime),
      end: dateTime(schedule.endTime),
      recurrence: recurrence ? [recurrence] : undefined,
      conferenceData: { createRequest: { requestId: id, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    }),
  })
  if (response.status === 409) response = await getEvent()

  while (response.ok) {
    const data = await response.json() as ConferenceResponse
    const link = data.hangoutLink ?? data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri
    if (typeof link === 'string' && MEET_URL.test(link)) return link
    if (data.conferenceData?.createRequest?.status?.statusCode !== 'pending') break
    await new Promise((resolve) => setTimeout(resolve, 750))
    response = await getEvent()
  }
  throw new Error('Google Calendar did not return a Google Meet link.')
}
