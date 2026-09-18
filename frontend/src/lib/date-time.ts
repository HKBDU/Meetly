import { format, isValid, parseISO } from 'date-fns';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseDate(value: string): Date | null {
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(value: string): string {
  const date = parseDate(value);
  return date ? format(date, 'MMM d, yyyy') : value;
}

export function formatHourLabel(time: string): string {
  const minutes = timeToMinutes(time);
  if (!Number.isFinite(minutes)) return time;
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function timeToMinutes(time: string): number {
  if (!TIME_PATTERN.test(time)) return Number.NaN;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60)
    .toString()
    .padStart(2, '0')}`;
}

export function timesToMinuteRange(startTime: string, endTime: string): [number, number] {
  return [timeToMinutes(startTime), timeToMinutes(endTime)];
}

export function minuteRangeToTimes([start, end]: readonly [number, number]): [string, string] {
  return [minutesToTime(start), minutesToTime(end)];
}
