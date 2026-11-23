import { dateFormatter, fromIsoDate, timeToMinutes } from '@/lib/date-time'
import { EventType, SLOT_MINUTES, WEEKDAYS_MONDAY_FIRST } from '@/shared/constants'
import { t } from '@/shared/i18n'
import type { EventFormValues } from './schema'

/** "Mon, Nov 24" theo ngôn ngữ đang chọn */
export const formatDateChip = (date: Date) =>
  dateFormatter({ weekday: 'short', month: 'short', day: 'numeric' }).format(date)

/** "Every Mon, Tue" hoặc "Mon, Nov 24 – Fri, Nov 28" cho phần tóm tắt */
export function describeDays(values: Pick<EventFormValues, 'eventType' | 'dates' | 'weekdays'>): string {
  if (values.eventType === EventType.Weekdays) {
    if (values.weekdays.length === 0) return t('summary.noWeekdays')
    return describeWeekdays(values.weekdays)
  }
  if (values.dates.length === 0) return t('summary.noDates')
  const sorted = [...values.dates].sort()
  const first = formatDateChip(fromIsoDate(sorted[0]))
  if (sorted.length === 1) return first
  return `${first} – ${formatDateChip(fromIsoDate(sorted[sorted.length - 1]))}`
}

/** "Every Mon, Tue" / "T2, T3 hằng tuần" */
export function describeWeekdays(weekdays: readonly number[]): string {
  const days = WEEKDAYS_MONDAY_FIRST.filter((day) => weekdays.includes(day.value))
    .map((day) => day.shortLabel)
    .join(', ')
  return t('summary.every', { days })
}

export function dayCount(values: Pick<EventFormValues, 'eventType' | 'dates' | 'weekdays'>): number {
  return values.eventType === EventType.Weekdays ? values.weekdays.length : values.dates.length
}

/** Số phút mỗi ngày; NaN/âm nếu khung giờ chưa hợp lệ */
export function dailyMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start)
}

export function describeDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return t('duration.invalid')
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours ? t('duration.hours', { count: hours }) : '', rest ? t('duration.minutes', { count: rest }) : '']
    .filter(Boolean)
    .join(' ')
}

export function slotCount(values: Pick<EventFormValues, 'eventType' | 'dates' | 'weekdays' | 'dailyStartTime' | 'dailyEndTime'>): number {
  const minutes = dailyMinutes(values.dailyStartTime, values.dailyEndTime)
  return minutes > 0 ? dayCount(values) * Math.ceil(minutes / SLOT_MINUTES) : 0
}
