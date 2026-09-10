export function generateTimeSlots(start = '09:00', end = '17:00', intervalMinutes = 60): string[] {
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

export function isValidTimeRange(start: string, end: string): boolean {
  return Boolean(start && end) && start < end
}
