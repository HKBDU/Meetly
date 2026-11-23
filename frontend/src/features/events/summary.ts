import { fromIsoDate, timeToMinutes } from '@/lib/date-time'
import { EventType, SLOT_MINUTES, WEEKDAYS_MONDAY_FIRST } from '@/shared/constants'
import type { EventFormValues } from './schema'

export const dateChipFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

/** "Every Mon, Tue" hoặc "Mon, Nov 24 – Fri, Nov 28" cho phần tóm tắt */
export function describeDays(values: Pick<EventFormValues, 'eventType' | 'dates' | 'weekdays'>): string {
  if (values.eventType === EventType.Weekdays) {
    if (values.weekdays.length === 0) return 'No days picked yet'
    return `Every ${WEEKDAYS_MONDAY_FIRST.filter((day) => values.weekdays.includes(day.value))
      .map((day) => day.shortLabel)
      .join(', ')}`
  }
  if (values.dates.length === 0) return 'No dates picked yet'
  const sorted = [...values.dates].sort()
  const first = dateChipFormat.format(fromIsoDate(sorted[0]))
  if (sorted.length === 1) return first
  return `${first} – ${dateChipFormat.format(fromIsoDate(sorted[sorted.length - 1]))}`
}

export function dayCount(values: Pick<EventFormValues, 'eventType' | 'dates' | 'weekdays'>): number {
  return values.eventType === EventType.Weekdays ? values.weekdays.length : values.dates.length
}

/** Số phút mỗi ngày; NaN/âm nếu khung giờ chưa hợp lệ */
export function dailyMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start)
}

export function describeDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Invalid time range'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours ? `${hours} h` : '', rest ? `${rest} min` : ''].filter(Boolean).join(' ')
}

export function slotCount(values: Pick<EventFormValues, 'eventType' | 'dates' | 'weekdays' | 'dailyStartTime' | 'dailyEndTime'>): number {
  const minutes = dailyMinutes(values.dailyStartTime, values.dailyEndTime)
  return minutes > 0 ? dayCount(values) * Math.ceil(minutes / SLOT_MINUTES) : 0
}
