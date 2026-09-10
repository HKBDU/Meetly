const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function formatDateForApi(date: Date | string): string {
  if (typeof date === 'string' && DATE_PATTERN.test(date)) return date
  const value = typeof date === 'string' ? new Date(date) : date
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

export function generateDateRange(start: Date, numberOfDays: number): string[] {
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(start)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + index)
    return formatDateForApi(date)
  })
}

export function isPastDate(date: Date | string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const candidate = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date)
  candidate.setHours(0, 0, 0, 0)
  return candidate < today
}

export function isFutureDate(date: Date | string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const candidate = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date)
  candidate.setHours(0, 0, 0, 0)
  return candidate > today
}
