import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { isBlockedPastDate } from './schema';

function uniqueSortedDates(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function applyDirectDateSelection(
  currentDates: readonly string[],
  nextDates: readonly string[],
  triggerDate: Date,
  existingDates: readonly string[],
  today = new Date(),
): string[] {
  if (isBlockedPastDate(triggerDate, existingDates, today)) return [...currentDates];
  return uniqueSortedDates(nextDates);
}

export function applyDraggedDateRange(
  currentDates: readonly string[],
  start: Date,
  end: Date,
  selecting: boolean,
): string[] {
  const [from, to] = startOfDay(start) <= startOfDay(end) ? [start, end] : [end, start];
  const range = new Set(eachDayOfInterval({ start: from, end: to }).map((date) => format(date, 'yyyy-MM-dd')));

  return selecting
    ? uniqueSortedDates([...currentDates, ...range])
    : currentDates.filter((date) => !range.has(date)).sort();
}
