import { timeToMinutes } from '@/lib/date-time'
import type { TimeColumn, TimeRow } from '@/shared/grid/model'
import { getSlotId } from '@/features/participants/gridUtils'

/**
 * Đổi giờ bận lấy từ Google Calendar (freeBusy) thành các ô rảnh trên lưới cá nhân.
 * Chỉ xét các ô đang có trên lưới; giờ bận nằm ngoài lưới bị bỏ qua.
 */

/** Một khoảng bận như Google trả về: mốc thời gian ISO 8601, thường theo UTC ("2026-12-10T02:00:00Z") */
export interface BusyInterval {
  start: string
  end: string
}

/** Một đoạn bận trong một ngày, theo giờ địa phương của event */
interface DaySegment {
  date: string
  dayOfWeek: number
  /** Phút tính từ 00:00, `end` tối đa 1440 */
  start: number
  end: number
}

const MINUTES_PER_DAY = 24 * 60

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>()

function zonedFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = zonedFormatterCache.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    zonedFormatterCache.set(timeZone, formatter)
  }
  return formatter
}

/** Mốc thời gian -> ngày "YYYY-MM-DD" và số phút trong ngày, theo giờ địa phương của `timeZone` */
function toZonedWallTime(instant: Date, timeZone: string): { date: string; minutes: number } {
  const parts: Record<string, string> = {}
  for (const part of zonedFormatter(timeZone).formatToParts(instant)) parts[part.type] = part.value
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60,
  }
}

/** Ngày "YYYY-MM-DD" cách `date` `days` ngày; tính theo UTC để không phụ thuộc múi giờ của máy */
export function addIsoDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

const nextIsoDate = (date: string) => addIsoDays(date, 1)

/** Hôm nay "YYYY-MM-DD" theo giờ địa phương của `timeZone` */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  return toZonedWallTime(now, timeZone).date
}

function isoWeekday(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** Cắt một khoảng bận thành từng đoạn theo ngày (khoảng bận qua nửa đêm thành 2 đoạn trở lên) */
function splitIntoDaySegments(interval: BusyInterval, timeZone: string): DaySegment[] {
  const startInstant = new Date(interval.start)
  const endInstant = new Date(interval.end)
  if (Number.isNaN(startInstant.getTime()) || Number.isNaN(endInstant.getTime())) return []
  if (endInstant <= startInstant) return []

  const start = toZonedWallTime(startInstant, timeZone)
  const end = toZonedWallTime(endInstant, timeZone)
  const segments: DaySegment[] = []
  for (let date = start.date; date <= end.date; date = nextIsoDate(date)) {
    const segmentStart = date === start.date ? start.minutes : 0
    const segmentEnd = date === end.date ? end.minutes : MINUTES_PER_DAY
    if (segmentEnd > segmentStart) {
      segments.push({ date, dayOfWeek: isoWeekday(date), start: segmentStart, end: segmentEnd })
    }
  }
  return segments
}

/**
 * Cột ngày cụ thể khớp đúng ngày; cột thứ trong tuần khớp mọi ngày cùng thứ,
 * chỉ trong `weeklyDates` nếu có truyền.
 */
function segmentMatchesColumn(segment: DaySegment, column: TimeColumn, weeklyDates: ReadonlySet<string> | null): boolean {
  if (column.specificDate !== null) return segment.date === column.specificDate
  return segment.dayOfWeek === column.dayOfWeek && (!weeklyDates || weeklyDates.has(segment.date))
}

export interface BusyToFreeSlotIdsInput {
  busy: readonly BusyInterval[]
  columns: readonly TimeColumn[]
  rows: readonly TimeRow[]
  /** Múi giờ IANA của event (VD "Asia/Ho_Chi_Minh"); giờ trên lưới hiểu theo múi này */
  timeZone: string
  /**
   * Event lặp theo tuần: các ngày thật "YYYY-MM-DD" dùng làm tham chiếu (VD 2 tuần tới).
   * Bỏ trống thì mọi ngày trong kết quả của Google đều được tính.
   */
  weeklyDates?: readonly string[]
}

/**
 * Trả về slot id của mọi ô KHÔNG trùng khoảng bận nào, theo thứ tự cột rồi hàng như `getAllSlotIds`.
 * Ô bị coi là bận khi giao nhau với một khoảng bận; chạm mép (bận tới đúng 10:00, ô bắt đầu 10:00) thì không tính.
 * Event lặp theo tuần: bận ở bất kỳ tuần nào trong khoảng đã hỏi Google thì ô đó là bận.
 * Ném `RangeError` nếu `timeZone` không hợp lệ.
 */
export function busyToFreeSlotIds({ busy, columns, rows, timeZone, weeklyDates }: BusyToFreeSlotIdsInput): string[] {
  const segments = busy.flatMap((interval) => splitIntoDaySegments(interval, timeZone))
  const weeklyDateSet = weeklyDates ? new Set(weeklyDates) : null
  const free: string[] = []
  for (const column of columns) {
    const columnSegments = segments.filter((segment) => segmentMatchesColumn(segment, column, weeklyDateSet))
    for (const row of rows) {
      const cellStart = timeToMinutes(row.startTime)
      const cellEnd = timeToMinutes(row.endTime)
      const isBusy = columnSegments.some((segment) => segment.start < cellEnd && segment.end > cellStart)
      if (!isBusy) free.push(getSlotId(column, row.startTime))
    }
  }
  return free
}
