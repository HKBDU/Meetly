import { addIsoDays, dateTimeInZone, getZonedInstants, isoWeekday, timeToMinutes } from '@/lib/date-time'
import { weekdayRank } from '@/shared/constants'
import { buildRows, getColumns, type TimeColumn, type TimeRow } from '@/shared/grid/model'
import { calendarOccurrenceDate } from '@/shared/lib/calendar'
import type { EventDetail, FinalSchedule } from '@/shared/types'

export type GridEvent = Pick<EventDetail, 'timezone' | 'eventType' | 'availableDates' | 'availableWeekdays' | 'dailyStartTime' | 'dailyEndTime'>

export interface ViewerCell {
  date: string
  endDate: string
  startTime: string
  endTime: string
  offsetMinutes: number
  endOffsetMinutes: number
  repeated: boolean
  epochMs: number
  rowKey: string
  columnKey: string
  source: { column: TimeColumn; row: TimeRow; rowIndex: number }
}

export interface ViewerRow {
  key: string
  startTime: string
  offsetMinutes?: number
}

export function getReferenceWeekStart(eventZone: string, now = Date.now()): string {
  const today = dateTimeInZone(now, eventZone).date
  return addIsoDays(today, (8 - isoWeekday(today)) % 7)
}

export function resolveScheduleDisplay(
  schedule: FinalSchedule,
  eventZone: string,
  displayZone: string,
  now: number,
  weekStart?: string,
) {
  const date = weekStart && !schedule.specificDate && schedule.dayOfWeek !== null
    ? addIsoDays(weekStart, weekdayRank(schedule.dayOfWeek))
    : calendarOccurrenceDate(schedule, eventZone, now)
  if (!date) return null
  const [start] = getZonedInstants(date, schedule.startTime, eventZone)
  if (start === undefined) return null
  const [end = start + (timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime)) * 60000] =
    getZonedInstants(date, schedule.endTime, eventZone)
  const localStart = dateTimeInZone(start, displayZone)
  const localEnd = dateTimeInZone(end, displayZone)
  return {
    date: localStart.date,
    startTime: localStart.time,
    endDate: localEnd.date,
    endTime: localEnd.time,
    startOffset: localStart.offsetMinutes,
    endOffset: localEnd.offsetMinutes,
    showOffsets: localStart.offsetMinutes !== localEnd.offsetMinutes ||
      getZonedInstants(localStart.date, localStart.time, displayZone).length > 1 ||
      getZonedInstants(localEnd.date, localEnd.time, displayZone).length > 1,
  }
}

export function formatUtcOffset(minutes: number): string {
  const absolute = Math.abs(minutes)
  return `UTC${minutes < 0 ? '−' : '+'}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(Math.floor(absolute % 60)).padStart(2, '0')}`
}

export function buildViewerGrid(event: GridEvent, viewerZone: string, weekStart: string) {
  const sourceRows = buildRows(event.dailyStartTime, event.dailyEndTime)
  const byColumn = new Map<string, ViewerCell[]>()
  const cells = new Map<string, ViewerCell>()
  const firstBySource = new Map<string, ViewerCell>()
  const repeatedTimes = new Map<string, number>()
  const rowsByKey = new Map<string, ViewerRow>()
  let matchesEvent = true
  let unavailableSourceTimes = false

  for (const column of getColumns(event)) {
    const date = column.specificDate ?? addIsoDays(weekStart, weekdayRank(column.dayOfWeek!))
    sourceRows.forEach((row, rowIndex) => {
      const [epochMs] = getZonedInstants(date, row.startTime, event.timezone)
      if (epochMs === undefined) {
        unavailableSourceTimes = true
        return
      }
      const slotLength = timeToMinutes(row.endTime) - timeToMinutes(row.startTime)
      const local = dateTimeInZone(epochMs, viewerZone)
      const next = dateTimeInZone(epochMs + slotLength * 60000, viewerZone)
      const occurrence = getZonedInstants(local.date, local.time, viewerZone)
      const folded = occurrence.length > 1
      const second = folded && epochMs >= occurrence[1]
      if (folded) repeatedTimes.set(local.time, (occurrence[1] - occurrence[0]) / 60000)
      if (local.date !== date || local.time !== row.startTime || next.date !== date || next.time !== row.endTime) matchesEvent = false
      const columnKey = `date:${local.date}`
      const rowKey = second ? `${local.time}-2` : local.time
      const cell: ViewerCell = {
        date: local.date, endDate: next.date, startTime: local.time, endTime: next.time,
        offsetMinutes: local.offsetMinutes, endOffsetMinutes: next.offsetMinutes, epochMs, rowKey, columnKey, repeated: folded,
        source: { column, row, rowIndex },
      }
      if (!byColumn.has(columnKey)) byColumn.set(columnKey, [])
      byColumn.get(columnKey)!.push(cell)
      cells.set(`${columnKey}|${rowKey}`, cell)
      if (!firstBySource.has(column.key)) firstBySource.set(column.key, cell)
      firstBySource.set(`${column.key}|${row.startTime}`, cell)
      if (folded || !rowsByKey.has(rowKey)) {
        rowsByKey.set(rowKey, { key: rowKey, startTime: local.time, ...(folded ? { offsetMinutes: local.offsetMinutes } : {}) })
      }
    })
  }

  // Put the second occurrence after the corresponding repeated hour, in chronological order.
  const order = (row: ViewerRow) => timeToMinutes(row.startTime) + (row.key.endsWith('-2') ? repeatedTimes.get(row.startTime) ?? 0 : 0)
  const rows = [...rowsByKey.values()].sort((a, b) => order(a) - order(b) || b.key.length - a.key.length)
  const columns: TimeColumn[] = [...byColumn.keys()].sort().map((key) => ({
    key, specificDate: key.slice(5), dayOfWeek: null,
  }))
  for (const columnCells of byColumn.values()) columnCells.sort((a, b) => a.epochMs - b.epochMs)
  const rowIndexByKey = new Map(rows.map(({ key }, index) => [key, index]))
  return { columns, rows, rowIndexByKey, cells, byColumn, firstBySource, matchesEvent, unavailableSourceTimes }
}

export type ViewerGrid = ReturnType<typeof buildViewerGrid>
