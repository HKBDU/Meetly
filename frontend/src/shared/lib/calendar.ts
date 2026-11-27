import { addIsoDays, dateTimeInZone, isoWeekday } from '@/lib/date-time'
import type { EventDetail, FinalSchedule } from '@/shared/types'

const BY_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const
type CalendarEvent = Pick<EventDetail, 'title' | 'url' | 'timezone'> & { meetingUrl?: string | null }

export function calendarOccurrenceDate(schedule: FinalSchedule, timeZone: string, now = Date.now()): string | null {
  if (schedule.specificDate) return schedule.specificDate
  if (schedule.dayOfWeek === null) return null
  const today = dateTimeInZone(now, timeZone).date
  // Match the Backend's date-based rule, including a matching weekday today.
  return addIsoDays(today, (schedule.dayOfWeek - isoWeekday(today) + 7) % 7)
}

export function calendarRecurrence(schedule: FinalSchedule): string | undefined {
  if (!schedule.specificDate && schedule.dayOfWeek !== null) {
    return `RRULE:FREQ=WEEKLY;BYDAY=${BY_DAY[schedule.dayOfWeek]}`
  }
}

export function buildGoogleCalendarUrl(
  event: CalendarEvent,
  finalSchedule: FinalSchedule,
  now = Date.now(),
): string | null {
  const date = calendarOccurrenceDate(finalSchedule, event.timezone, now)
  if (!date) return null
  const { meetingUrl } = event
  const stamp = (time: string) => `${date.replaceAll('-', '')}T${(time.length === 5 ? `${time}:00` : time.slice(0, 8)).replaceAll(':', '')}`
  const url = new URL('https://calendar.google.com/calendar/render')
  url.search = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(finalSchedule.startTime)}/${stamp(finalSchedule.endTime)}`,
    details: [event.url, meetingUrl].filter(Boolean).join('\n'),
    ctz: event.timezone,
  }).toString()
  const recurrence = calendarRecurrence(finalSchedule)
  if (recurrence) url.searchParams.set('recur', recurrence)
  if (meetingUrl) url.searchParams.set('location', meetingUrl)
  return url.href
}

export function buildCalendarDownloadUrl(apiBaseUrl: string, shortCode: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/api/v1/events/${encodeURIComponent(shortCode)}/calendar.ics`
}
