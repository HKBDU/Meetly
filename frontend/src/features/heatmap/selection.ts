import { timeToMinutes } from '@/lib/date-time'
import { EventType, SLOT_MINUTES } from '@/shared/constants'
import type { EventDetail, FinalSchedule } from '@/shared/types'
import type { SelectedCell } from './types'

export function normalizeSelection(start: SelectedCell, end: SelectedCell): FinalSchedule | null {
  if (start.column.key !== end.column.key) return null
  return {
    specificDate: start.column.specificDate,
    dayOfWeek: start.column.dayOfWeek,
    startTime: start.row.startTime < end.row.startTime ? start.row.startTime : end.row.startTime,
    endTime: start.row.endTime > end.row.endTime ? start.row.endTime : end.row.endTime,
  }
}

export function isValidSchedule(event: EventDetail, slot: FinalSchedule): boolean {
  const correctDay =
    event.eventType === EventType.Dates
      ? slot.dayOfWeek === null && event.availableDates.includes(slot.specificDate ?? '')
      : slot.specificDate === null &&
        slot.dayOfWeek !== null &&
        event.availableWeekdays.includes(slot.dayOfWeek)
  const start = timeToMinutes(slot.startTime)
  const end = timeToMinutes(slot.endTime)
  const dailyStart = timeToMinutes(event.dailyStartTime)
  const dailyEnd = timeToMinutes(event.dailyEndTime)
  return (
    correctDay &&
    start >= dailyStart &&
    end <= dailyEnd &&
    start < end &&
    (start - dailyStart) % SLOT_MINUTES === 0 &&
    ((end - dailyStart) % SLOT_MINUTES === 0 || end === dailyEnd)
  )
}
