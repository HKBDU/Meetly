import { formatDate, fromIsoDate, minutesToTime, timeToMinutes } from '@/lib/date-time'
import { EventType, SLOT_MINUTES, WEEKDAYS, weekdayRank } from '@/shared/constants'
import { t } from '@/shared/i18n'
import type { DayOfWeek, EventDetail, FinalSchedule } from '@/shared/types'

/**
 * Model lưới thời gian dùng chung cho heatmap nhóm và lưới cá nhân:
 * cột = ngày cụ thể hoặc thứ trong tuần, hàng = ô 15 phút.
 */

export interface TimeColumn {
  /** "date:YYYY-MM-DD" hoặc "weekday:N", ổn định để làm React key và slot id */
  key: string
  specificDate: string | null
  dayOfWeek: DayOfWeek | null
}

export interface TimeRow {
  startTime: string
  endTime: string
}

export const MOBILE_COLUMNS_PER_PAGE = 3
export const DESKTOP_COLUMNS_PER_PAGE = 7

export function buildRows(startTime: string, endTime: string): TimeRow[] {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return []
  const rows: TimeRow[] = []
  for (let minute = start; minute < end; minute += SLOT_MINUTES) {
    rows.push({
      startTime: minutesToTime(minute),
      endTime: minutesToTime(Math.min(minute + SLOT_MINUTES, end)),
    })
  }
  return rows
}

export const columnKey = (slot: Pick<FinalSchedule, 'specificDate' | 'dayOfWeek'>) =>
  slot.specificDate !== null ? `date:${slot.specificDate}` : `weekday:${slot.dayOfWeek}`

type ColumnSource = Pick<EventDetail, 'eventType' | 'availableDates' | 'availableWeekdays'>

export function getColumns(event: ColumnSource): TimeColumn[] {
  if (event.eventType === EventType.Weekdays) {
    return [...event.availableWeekdays]
      .sort((a, b) => weekdayRank(a) - weekdayRank(b))
      .map((dayOfWeek) => ({
        key: columnKey({ specificDate: null, dayOfWeek }),
        specificDate: null,
        dayOfWeek,
      }))
  }
  return [...event.availableDates].sort().map((specificDate) => ({
    key: columnKey({ specificDate, dayOfWeek: null }),
    specificDate,
    dayOfWeek: null,
  }))
}

type DaySource = Pick<FinalSchedule, 'specificDate' | 'dayOfWeek'>

const weekdayOf = (slot: DaySource) =>
  WEEKDAYS[slot.specificDate !== null ? fromIsoDate(slot.specificDate).getDay() : (slot.dayOfWeek ?? 0)]

/** Tên thứ của cột ("Monday" / "Thứ Hai"); tính lúc render để theo ngôn ngữ đang chọn */
export const columnLabel = (column: DaySource) => weekdayOf(column).label
export const columnShortLabel = (column: DaySource) => weekdayOf(column).shortLabel
/** Dòng phụ dưới tên thứ: ngày cụ thể hoặc "Weekly" */
export const columnDetail = (column: DaySource) =>
  column.specificDate !== null ? formatDate(column.specificDate) : t('grid.weekly')

export function getColumnPage<T>(
  columns: readonly T[],
  pageIndex: number,
  pageSize = MOBILE_COLUMNS_PER_PAGE,
): T[] {
  const safePageIndex = Math.max(0, Math.floor(pageIndex))
  return columns.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize)
}

export function getPageCount(columnCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, columnCount) / pageSize))
}

export function formatDay(slot: DaySource): string {
  if (slot.specificDate !== null) return formatDate(slot.specificDate)
  return columnLabel(slot)
}

export function containsCell(range: FinalSchedule, column: TimeColumn, row: TimeRow): boolean {
  return (
    range.specificDate === column.specificDate &&
    range.dayOfWeek === column.dayOfWeek &&
    range.startTime <= row.startTime &&
    range.endTime >= row.endTime
  )
}
