import type { EventData, TimeSlot } from '@/shared/types'

export const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

export const DAY_MINUTES = 24 * 60
export const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
export const clock = (value: number) => {
  const normalized = ((value % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}
export const duration = (start: string, end: string) => (minutes(end) - minutes(start) + DAY_MINUTES) % DAY_MINUTES
export const offset = (start: string, time: string) => (minutes(time) - minutes(start) + DAY_MINUTES) % DAY_MINUTES

export function times(start: string, end: string, step = 15) {
  const result: string[] = []
  for (let value = 0; value < duration(start, end); value += step) result.push(clock(minutes(start) + value))
  return result
}

export function subTimes(time: string, step: number): string[] {
  if (step <= 15) return [time]
  const list: string[] = []
  for (let offsetMinutes = 0; offsetMinutes < step; offsetMinutes += 15) {
    list.push(clock(minutes(time) + offsetMinutes))
  }
  return list
}

export type SessionType = 'all' | 'morning' | 'afternoon' | 'evening'

export function getTimeSession(time: string, dailyStartTime?: string): 'morning' | 'afternoon' | 'evening' {
  const m = minutes(time)
  if (dailyStartTime && minutes(time) < minutes(dailyStartTime)) {
    if (m < 6 * 60) return 'evening'
  }
  if (m < 12 * 60) return 'morning'
  if (m < 18 * 60) return 'afternoon'
  return 'evening'
}

export const isOvernight = (start: string, end: string) => minutes(end) < minutes(start)
export const timeLabel = (time: string, start: string) => `${time}${minutes(time) < minutes(start) ? ' (+1 ngày)' : ''}`
export const rangeInWindow = (windowStart: string, windowEnd: string, start: string, end: string) => {
  const rangeDuration = duration(start, end)
  return rangeDuration > 0 && offset(windowStart, start) + rangeDuration <= duration(windowStart, windowEnd)
}

export const targetKey = (specificDate: string | null, dayOfWeek: number | null) =>
  specificDate ?? `weekday:${dayOfWeek}`

export const cellKey = (target: string, time: string) => `${target}|${time}`

export function slotsToCells(slots: TimeSlot[], step = 15) {
  const cells = new Set<string>()
  for (const slot of slots) {
    const target = targetKey(slot.specificDate, slot.dayOfWeek)
    for (const time of times(slot.startTime, slot.endTime, step)) cells.add(cellKey(target, time))
  }
  return cells
}

export function cellsToSlots(event: EventData, cells: Set<string>, step = 15): TimeSlot[] {
  const result: TimeSlot[] = []
  const targets = event.eventType === 1
    ? event.availableDates.map((value) => ({ key: value, specificDate: value, dayOfWeek: null }))
    : event.availableWeekdays.map((value) => ({ key: `weekday:${value}`, specificDate: null, dayOfWeek: value }))
  const gridTimes = times(event.dailyStartTime, event.dailyEndTime, step)
  for (const target of targets) {
    let start: string | null = null
    for (let index = 0; index <= gridTimes.length; index++) {
      const selected = index < gridTimes.length && cells.has(cellKey(target.key, gridTimes[index]))
      if (selected && start === null) start = gridTimes[index]
      if (!selected && start !== null) {
        result.push({
          specificDate: target.specificDate,
          dayOfWeek: target.dayOfWeek,
          startTime: start,
          endTime: index < gridTimes.length ? gridTimes[index] : event.dailyEndTime,
        })
        start = null
      }
    }
  }
  return result
}

export function targetLabel(event: EventData, specificDate: string | null, dayOfWeek: number | null) {
  if (event.eventType === 2) return WEEKDAYS[dayOfWeek ?? 0]
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .format(new Date(`${specificDate}T00:00:00`))
}

export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateDMY(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function formatEventDatesSummary(event: EventData): string {
  if (event.eventType === 2) {
    const days = [...event.availableWeekdays].sort((a, b) => a - b)
    if (days.length === 0) return ''
    if (days.length === 7) return 'Hàng ngày'
    const isConsecutive = days.every((d, i) => i === 0 || d === days[i - 1] + 1)
    if (isConsecutive && days.length > 2) {
      return `${WEEKDAYS[days[0]]} – ${WEEKDAYS[days[days.length - 1]]} hàng tuần`
    }
    return `${days.map((d) => WEEKDAYS[d]).join(', ')} hàng tuần`
  }

  const dates = [...event.availableDates].sort()
  if (dates.length === 0) return ''
  if (dates.length === 1) {
    const d = new Date(`${dates[0]}T00:00:00`)
    return `${targetLabel(event, dates[0], null)}/${d.getFullYear()}`
  }

  const timestamps = dates.map((d) => new Date(`${d}T00:00:00`).getTime())
  const isConsecutive = timestamps.every((t, i) => i === 0 || Math.round((t - timestamps[i - 1]) / 86400000) === 1)

  const firstDMY = formatDateDMY(dates[0])
  const lastDMY = formatDateDMY(dates[dates.length - 1])

  if (isConsecutive) {
    const firstYear = dates[0].slice(0, 4)
    const lastYear = dates[dates.length - 1].slice(0, 4)
    if (firstYear === lastYear) {
      return `${firstDMY.slice(0, 5)} – ${lastDMY} (${dates.length} ngày)`
    }
    return `${firstDMY} – ${lastDMY} (${dates.length} ngày)`
  }

  if (dates.length <= 3) {
    return `${dates.map((d) => d.slice(8, 10) + '/' + d.slice(5, 7)).join(', ')}/${dates[0].slice(0, 4)} (${dates.length} ngày)`
  }

  return `${dates[0].slice(8, 10)}/${dates[0].slice(5, 7)}, ${dates[1].slice(8, 10)}/${dates[1].slice(5, 7)}... (+${dates.length - 2} ngày khác)`
}

