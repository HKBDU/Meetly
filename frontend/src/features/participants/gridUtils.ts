import { minutesToTime, timeToMinutes } from '@/lib/date-time'
import { SLOT_MINUTES } from '@/shared/constants'
import { columnKey, type TimeColumn } from '@/shared/grid/model'
import type { TimeSlotRange } from '@/shared/api/events'
import type { PaintMode } from '@/features/participants/types'

/**
 * Lịch cá nhân lưu dạng tập slot id `"<columnKey>@<HH:mm>"` (một ô 15 phút) để tô nhanh;
 * khi gửi BE thì gộp các ô liền kề thành khoảng, khi nhận thì bung ngược lại.
 */

export function getSlotId(column: Pick<TimeColumn, 'key'>, time: string): string {
  return `${column.key}@${time}`
}

function parseSlotId(slotId: string): { key: string; minutes: number } {
  const at = slotId.lastIndexOf('@')
  return { key: slotId.slice(0, at), minutes: timeToMinutes(slotId.slice(at + 1)) }
}

export function getAllSlotIds(columns: readonly TimeColumn[], times: readonly string[]): string[] {
  return columns.flatMap((column) => times.map((time) => getSlotId(column, time)))
}

/** Đổi tập ô đang tô thành danh sách slot RẢNH: FREE lấy thẳng, BUSY lấy phần bù trên lưới */
export function resolveFreeSlotIds(
  selectedSlotIds: ReadonlySet<string>,
  paintMode: PaintMode,
  allSlotIds: readonly string[],
): string[] {
  return paintMode === 'FREE'
    ? allSlotIds.filter((id) => selectedSlotIds.has(id))
    : allSlotIds.filter((id) => !selectedSlotIds.has(id))
}

/** Các slot id của 1 cột từ `startTime` (gồm) tới `endTime` (không gồm) */
export function buildSlotIdsInRange(column: Pick<TimeColumn, 'key'>, startTime: string, endTime: string): string[] {
  const ids: string[] = []
  for (let minute = timeToMinutes(startTime); minute < timeToMinutes(endTime); minute += SLOT_MINUTES) {
    ids.push(getSlotId(column, minutesToTime(minute)))
  }
  return ids
}

/** Gộp các ô liền kề cùng cột thành 1 khoảng; đổi cột hoặc hở thì tách khoảng mới */
export function mergeFreeSlotIdsIntoRanges(
  freeSlotIds: readonly string[],
  columns: readonly TimeColumn[],
): TimeSlotRange[] {
  const columnByKey = new Map(columns.map((column) => [column.key, column]))
  const sorted = freeSlotIds
    .map(parseSlotId)
    .filter((slot) => columnByKey.has(slot.key) && Number.isFinite(slot.minutes))
    .sort((a, b) => (a.key === b.key ? a.minutes - b.minutes : a.key.localeCompare(b.key)))

  const ranges: TimeSlotRange[] = []
  let current: { key: string; start: number; end: number } | null = null

  const close = () => {
    if (!current) return
    const column = columnByKey.get(current.key)!
    ranges.push({
      specificDate: column.specificDate,
      dayOfWeek: column.dayOfWeek,
      startTime: minutesToTime(current.start),
      endTime: minutesToTime(current.end),
    })
  }

  for (const slot of sorted) {
    if (current && slot.key === current.key && slot.minutes === current.end) {
      current.end += SLOT_MINUTES
      continue
    }
    if (current && slot.key === current.key && slot.minutes < current.end) continue
    close()
    current = { key: slot.key, start: slot.minutes, end: slot.minutes + SLOT_MINUTES }
  }
  close()

  return ranges
}

/** Chiều ngược của `mergeFreeSlotIdsIntoRanges`, chỉ giữ các ô còn nằm trên lưới hiện tại */
export function expandRangesToSlotIds(
  ranges: readonly TimeSlotRange[],
  columns: readonly TimeColumn[],
  times: readonly string[],
): string[] {
  const keys = new Set(columns.map((column) => column.key))
  const timeSet = new Set(times)
  const ids: string[] = []
  for (const range of ranges) {
    const key = columnKey(range)
    if (!keys.has(key)) continue
    for (const id of buildSlotIdsInRange({ key }, range.startTime, range.endTime)) {
      if (timeSet.has(id.slice(key.length + 1))) ids.push(id)
    }
  }
  return ids
}
