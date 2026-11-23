import { isValid, parseISO } from 'date-fns';

import { getLocale, intlLocale, type Locale } from '@/shared/i18n';

/** Mọi hàm ngày/giờ của app nằm ở đây; ngày dạng "YYYY-MM-DD", giờ dạng "HH:mm" */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseDate(value: string): Date | null {
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/** Intl.DateTimeFormat theo ngôn ngữ hiện tại, tạo một lần cho mỗi cặp (ngôn ngữ, tuỳ chọn) */
export function dateFormatter(options: Intl.DateTimeFormatOptions, locale: Locale = getLocale()): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocale(locale), options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/** "Nov 24, 2026" / "24 thg 11, 2026" */
export function formatDate(value: string): string {
  const date = parseDate(value);
  return date ? dateFormatter({ month: 'short', day: 'numeric', year: 'numeric' }).format(date) : value;
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

/** Nhãn mốc giờ ở cột trái lưới: "9 AM" (tiếng Anh) hoặc "9:00" (tiếng Việt quen dùng 24 giờ) */
export function formatHourLabel(time: string): string {
  const minutes = timeToMinutes(time);
  if (!Number.isFinite(minutes)) return time;
  const hour = Math.floor(minutes / 60);
  if (getLocale() === 'vi') return `${hour}:00`;
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
