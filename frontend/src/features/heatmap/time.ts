import type { FinalSchedule, HeatmapEvent, SelectedCell, TimeColumn, TimeRow } from './types.ts';

export const SLOT_MINUTES = 15;
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function toMinutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatTime(minutes: number): string {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
}

export function buildRows(startTime: string, endTime: string): TimeRow[] {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const rows: TimeRow[] = [];
  for (let minute = start; minute < end; minute += SLOT_MINUTES) {
    rows.push({
      startTime: formatTime(minute),
      endTime: formatTime(Math.min(minute + SLOT_MINUTES, end)),
    });
  }
  return rows;
}

export function getColumns(event: HeatmapEvent): TimeColumn[] {
  if (event.eventType === 2) {
    return event.availableWeekdays.map((dayOfWeek) => ({
      key: `weekday:${dayOfWeek}`,
      label: weekdays[dayOfWeek],
      detail: 'Weekly',
      specificDate: null,
      dayOfWeek,
    }));
  }
  return event.availableDates.map((specificDate) => ({
    key: `date:${specificDate}`,
    label: weekdays[new Date(`${specificDate}T00:00:00Z`).getUTCDay()],
    detail: dateFormatter.format(new Date(`${specificDate}T00:00:00Z`)),
    specificDate,
    dayOfWeek: null,
  }));
}

export function formatDay(slot: Pick<FinalSchedule, 'specificDate' | 'dayOfWeek'>): string {
  if (slot.specificDate !== null)
    return dateFormatter.format(new Date(`${slot.specificDate}T00:00:00Z`));
  return weekdays[slot.dayOfWeek ?? 0];
}

export function normalizeSelection(start: SelectedCell, end: SelectedCell): FinalSchedule | null {
  if (start.column.key !== end.column.key) return null;
  return {
    specificDate: start.column.specificDate,
    dayOfWeek: start.column.dayOfWeek,
    startTime: start.row.startTime < end.row.startTime ? start.row.startTime : end.row.startTime,
    endTime: start.row.endTime > end.row.endTime ? start.row.endTime : end.row.endTime,
  };
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
  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);
  const dailyStart = toMinutes(event.dailyStartTime);
  const dailyEnd = toMinutes(event.dailyEndTime);
  return (
    correctDay &&
    start >= dailyStart &&
    end <= dailyEnd &&
    start < end &&
    (start - dailyStart) % SLOT_MINUTES === 0 &&
    ((end - dailyStart) % SLOT_MINUTES === 0 || end === dailyEnd)
  );
}
