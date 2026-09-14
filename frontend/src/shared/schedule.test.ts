import assert from 'node:assert/strict'
import { cellsToSlots, rangeInWindow, slotsToCells, times } from './schedule.ts'
import type { EventData, TimeSlot } from './types/index.ts'

const event = {
  eventType: 1,
  availableDates: ['2026-09-20'],
  availableWeekdays: [],
  dailyStartTime: '08:00',
  dailyEndTime: '10:00',
} as EventData
const slots: TimeSlot[] = [{ specificDate: '2026-09-20', dayOfWeek: null, startTime: '08:15', endTime: '09:00' }]

assert.deepEqual(cellsToSlots(event, slotsToCells(slots)), slots)

const overnight = { ...event, dailyStartTime: '23:00', dailyEndTime: '01:00' }
const overnightSlots: TimeSlot[] = [{ specificDate: '2026-09-20', dayOfWeek: null, startTime: '23:30', endTime: '00:30' }]
assert.deepEqual(times('23:00', '01:00'), ['23:00', '23:15', '23:30', '23:45', '00:00', '00:15', '00:30', '00:45'])
assert.deepEqual(cellsToSlots(overnight, slotsToCells(overnightSlots)), overnightSlots)
assert.equal(rangeInWindow('23:00', '01:00', '23:30', '00:30'), true)
assert.equal(rangeInWindow('23:00', '01:00', '22:30', '00:30'), false)
