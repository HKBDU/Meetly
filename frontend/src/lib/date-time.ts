import { format, isValid, parseISO } from 'date-fns';

/** Mọi hàm ngày/giờ của app nằm ở đây; ngày dạng "YYYY-MM-DD", giờ dạng "HH:mm" */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseDate(value: string): Date | null {
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(value: string): string {
  const date = parseDate(value);
  return date ? format(date, 'MMM d, yyyy') : value;
}

/** Date theo giờ máy -> "YYYY-MM-DD" (không qua UTC để không lệch ngày) */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" -> Date lúc 00:00 giờ máy */
export function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function formatHourLabel(time: string): string {
  const minutes = timeToMinutes(time);
  if (!Number.isFinite(minutes)) return time;
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** "09:30" (hoặc "09:30:00") -> 570; sai định dạng trả NaN */
export function timeToMinutes(time: string): number {
  const hhmm = time.slice(0, 5);
  if (!TIME_PATTERN.test(hhmm)) return Number.NaN;
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60)
    .toString()
    .padStart(2, '0')}`;
}

/** Các mốc "HH:mm" từ `start` tới trước `end`, mỗi mốc cách nhau `stepMinutes` */
export function timeSteps(start: string, end: string, stepMinutes: number): string[] {
  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
  const steps: string[] = [];
  for (let minute = from; minute < to; minute += stepMinutes) steps.push(minutesToTime(minute));
  return steps;
}
