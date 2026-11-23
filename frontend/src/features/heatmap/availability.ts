import type { AvailabilityLevel } from './constants'

export function getAvailabilityLevel(count: number, total: number): AvailabilityLevel {
  const ratio = total === 0 ? 0 : count / total
  if (ratio === 0) return 0
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  if (ratio < 1) return 4
  return 5
}

/** Class Tailwind tĩnh để trình biên dịch Tailwind nhìn thấy (không ghép chuỗi động) */
const HEAT_CLASS: Record<AvailabilityLevel, string> = {
  0: 'bg-heat-0',
  1: 'bg-heat-1',
  2: 'bg-heat-2',
  3: 'bg-heat-3',
  4: 'bg-heat-4',
  5: 'bg-heat-5',
}

export function getAvailabilityLevelClass(level: AvailabilityLevel): string {
  return HEAT_CLASS[level]
}

export function getAvailabilityClass(count: number, total: number): string {
  return HEAT_CLASS[getAvailabilityLevel(count, total)]
}
