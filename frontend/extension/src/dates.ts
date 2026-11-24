import { toIsoDate } from '@/lib/date-time'

/** Ngày thứ `offset` kể từ ngày mai (event không chọn được ngày đã qua) */
export function dayFromTomorrow(offset: number): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 1 + offset)
  return date
}

function upcoming(count: number, keep: (day: number) => boolean): string[] {
  const result: string[] = []
  for (let offset = 0; result.length < count && offset < 60; offset++) {
    const date = dayFromTomorrow(offset)
    if (keep(date.getDay())) result.push(toIsoDate(date))
  }
  return result
}

export const nextDays = (count: number) => upcoming(count, () => true)
export const nextWorkdays = (count: number) => upcoming(count, (day) => day !== 0 && day !== 6)
export const nextWeekend = () => upcoming(2, (day) => day === 0 || day === 6)
