const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatDateForApi(date: Date | string): string {
  if (typeof date === 'string' && DATE_PATTERN.test(date)) {
    return date;
  }

  const value = (typeof date === 'string') ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return '';

  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  return `${year}-${month}-${day}`;
}

export const formatDateforApi = formatDateForApi;

export function generateDateRange(start: Date, numberOfDays: number) : string[]{
  const result: string[] = [];
  const current = new Date(start); // avoid mutating
  for (let i = 0; i < numberOfDays; i++){
    result.push(formatDateForApi(current))
    current.setDate(current.getDate() + 1)
  }

  return result;
}

export function isFutureDate(candidateDate: Date | string) : boolean {
  const candidate = (typeof candidateDate === 'string'
                                               ? new Date(candidateDate + 'T00:00:00') 
                                               : new Date(candidateDate) )
  // T00:00:00 avoid ISO 8601 Date Parsing Ambiguity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);
  return !Number.isNaN(candidate.getTime()) && today < candidate;
}

export function isPastDate(candidateDate: Date | string) : boolean {
  const candidate = (typeof candidateDate === 'string'
                                               ? new Date(candidateDate + 'T00:00:00') 
                                               : new Date(candidateDate) )
  // T00:00:00 avoid ISO 8601 Date Parsing Ambiguity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);
  return !Number.isNaN(candidate.getTime()) && today > candidate;
}

export function formatDateForDisplay(date: string): string {
  const match = DATE_PATTERN.exec(date);
  if (!match) return date;
  const [, year, month, day] = match;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${year}-${month}-${day}T00:00:00Z`));
}

export function getDateKey(date: Date): string {
  return formatDateForApi(date);
}

export function getMonthDays(month: Date): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, index) => new Date(year, monthIndex, index - mondayOffset + 1));
}
