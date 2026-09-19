import type { FinalSchedule, SelectedCell } from './types';

export function normalizeSelection(start: SelectedCell, end: SelectedCell): FinalSchedule | null {
  if (start.column.key !== end.column.key) return null;
  return {
    specificDate: start.column.specificDate,
    dayOfWeek: start.column.dayOfWeek,
    startTime: start.row.startTime < end.row.startTime ? start.row.startTime : end.row.startTime,
    endTime: start.row.endTime > end.row.endTime ? start.row.endTime : end.row.endTime,
  };
}
