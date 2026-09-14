import type { EventData, TimeSlot } from '@/shared/types'

export const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
const clock = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

export function times(start: string, end: string, step = 15) {
  const result: string[] = []
  for (let value = minutes(start); value < minutes(end); value += step) result.push(clock(value))
  return result
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
