export function generateTimeSlots(start = '00:00', end = '23:00', intervalMinutes = 60): string[] {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute
  const slots: string[] = []
  for (let total = startTotal; total <= endTotal; total += intervalMinutes) {
    slots.push(String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0'))
  }
  return slots
}

const MINUTES_PER_DAY = 24 * 60
export const TIME_STEP_MINUTES = 15

export const TIME_BOUNDARIES = Array.from(
  { length: MINUTES_PER_DAY / TIME_STEP_MINUTES + 1 },
  (_, index) => {
    const totalMinutes = index * TIME_STEP_MINUTES
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(
      totalMinutes % 60,
    ).padStart(2, '0')}`
  },
)

export function timeToBoundaryIndex(value: string, fallback: number) {
  const [hours, minutes] = value.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const index = totalMinutes / TIME_STEP_MINUTES
  return Number.isInteger(index) && index >= 0 && index < TIME_BOUNDARIES.length ? index : fallback
}

export function isValidTimeRange(start: string, end: string): boolean {
  return Boolean(start && end) && start < end
}
