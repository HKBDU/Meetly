import { formatDate, minutesToTime, timeToMinutes } from '@/lib/date-time';
import { MOBILE_COLUMNS_PER_PAGE, SLOT_MINUTES, WEEKDAYS } from './constants';
import type { FinalSchedule, HeatmapEvent, TimeColumn, TimeRow } from './types.ts';

export function buildRows(startTime: string, endTime: string): TimeRow[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const rows: TimeRow[] = [];
  for (let minute = start; minute < end; minute += SLOT_MINUTES) {
    rows.push({
      startTime: minutesToTime(minute),
      endTime: minutesToTime(Math.min(minute + SLOT_MINUTES, end)),
    });
  }
  return rows;
}

/** Thứ Hai đầu tuần, Chủ nhật cuối tuần; BE trả các thứ không theo thứ tự nào */
const weekdayRank = (day: number) => (day + 6) % 7;

export function getColumns(event: HeatmapEvent): TimeColumn[] {
  if (event.eventType === 2) {
    return [...event.availableWeekdays]
      .sort((a, b) => weekdayRank(a) - weekdayRank(b))
      .map((dayOfWeek) => ({
        key: `weekday:${dayOfWeek}`,
        label: WEEKDAYS[dayOfWeek].label,
        detail: 'Weekly',
        specificDate: null,
        dayOfWeek,
      }));
  }
  return [...event.availableDates].sort().map((specificDate) => ({
    key: `date:${specificDate}`,
    label: WEEKDAYS[new Date(`${specificDate}T00:00:00Z`).getUTCDay()].label,
    detail: formatDate(specificDate),
    specificDate,
    dayOfWeek: null,
  }));
}

export function getColumnPage<T>(
  columns: readonly T[],
  pageIndex: number,
  pageSize = MOBILE_COLUMNS_PER_PAGE,
): T[] {
  const safePageIndex = Math.max(0, Math.floor(pageIndex));
  return columns.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);
}

export function getPageCount(columnCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, columnCount) / pageSize));
}

export function formatDay(slot: Pick<FinalSchedule, 'specificDate' | 'dayOfWeek'>): string {
  if (slot.specificDate !== null)
    return formatDate(slot.specificDate);
  return WEEKDAYS[slot.dayOfWeek ?? 0].label;
}

export function containsCell(range: FinalSchedule, column: TimeColumn, row: TimeRow): boolean {
  return (
    range.specificDate === column.specificDate &&
    range.dayOfWeek === column.dayOfWeek &&
    range.startTime <= row.startTime &&
    range.endTime >= row.endTime
  );
}

export function isValidSchedule(event: HeatmapEvent, slot: FinalSchedule): boolean {
  const correctDay =
    event.eventType === 1
      ? slot.dayOfWeek === null && event.availableDates.includes(slot.specificDate ?? '')
      : slot.specificDate === null &&
        slot.dayOfWeek !== null &&
        event.availableWeekdays.includes(slot.dayOfWeek);
  const start = timeToMinutes(slot.startTime);
  const end = timeToMinutes(slot.endTime);
  const dailyStart = timeToMinutes(event.dailyStartTime);
  const dailyEnd = timeToMinutes(event.dailyEndTime);
  return (
    correctDay &&
    start >= dailyStart &&
    end <= dailyEnd &&
    start < end &&
    (start - dailyStart) % SLOT_MINUTES === 0 &&
    ((end - dailyStart) % SLOT_MINUTES === 0 || end === dailyEnd)
  );
}
