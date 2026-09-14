import assert from 'node:assert/strict'
import { cellsToSlots, rangeInWindow, slotsToCells, times } from './schedule.ts'
import type { EventData, TimeSlot } from './types/index.ts'

const event = {
  eventType: 1,
  availableDates: ['2026-09-20'],
  availableWeekdays: [],
  dailyStartTime: '08:00',
  dailyEndTime: '10:00',
} as unknown as EventData
const slots: TimeSlot[] = [{ specificDate: '2026-09-20', dayOfWeek: null, startTime: '08:15', endTime: '09:00' }]

assert.deepEqual(cellsToSlots(event, slotsToCells(slots)), slots)

const overnight = { ...event, dailyStartTime: '23:00', dailyEndTime: '01:00' }
const overnightSlots: TimeSlot[] = [{ specificDate: '2026-09-20', dayOfWeek: null, startTime: '23:30', endTime: '00:30' }]
assert.deepEqual(times('23:00', '01:00'), ['23:00', '23:15', '23:30', '23:45', '00:00', '00:15', '00:30', '00:45'])
assert.deepEqual(cellsToSlots(overnight, slotsToCells(overnightSlots)), overnightSlots)
assert.equal(rangeInWindow('23:00', '01:00', '23:30', '00:30'), true)
assert.equal(rangeInWindow('23:00', '01:00', '22:30', '00:30'), false)

import { getTimeSession, subTimes } from './schedule.ts'
assert.deepEqual(subTimes('12:00', 30), ['12:00', '12:15'])
assert.deepEqual(subTimes('12:00', 15), ['12:00'])
assert.equal(getTimeSession('09:00'), 'morning')
assert.equal(getTimeSession('14:00'), 'afternoon')
assert.equal(getTimeSession('19:00'), 'evening')
assert.equal(getTimeSession('01:00', '20:00'), 'evening')

const sub0800 = subTimes('08:00', 30)
assert.deepEqual(sub0800, ['08:00', '08:15'])
const cellSet = new Set(sub0800.map((t) => `2026-09-20|${t}`))
const computedSlots = cellsToSlots(event, cellSet)
assert.deepEqual(computedSlots, [{ specificDate: '2026-09-20', dayOfWeek: null, startTime: '08:00', endTime: '08:30' }])

const times15 = times('08:00', '12:00', 15)
const times30 = times('08:00', '12:00', 30)
assert.equal(times15.length, 16)
assert.equal(times30.length, 8)

import { formatDateDMY, formatEventDatesSummary, toLocalDateString } from './schedule.ts'
assert.equal(formatDateDMY('2026-09-20'), '20/09/2026')
assert.match(toLocalDateString(), /^\d{4}-\d{2}-\d{2}$/)

// Test consecutive dates
const eventConsecutive = {
  ...event,
  availableDates: ['2026-09-20', '2026-09-21', '2026-09-22'],
}
assert.equal(formatEventDatesSummary(eventConsecutive), '20/09 – 22/09/2026 (3 ngày)')

// Test non-consecutive dates
const eventNonConsecutive = {
  ...event,
  availableDates: ['2026-09-20', '2026-09-22', '2026-09-25'],
}
assert.equal(formatEventDatesSummary(eventNonConsecutive), '20/09, 22/09, 25/09/2026 (3 ngày)')

// Test weekdays
const eventWeekdays = {
  ...event,
  eventType: 2,
  availableWeekdays: [1, 2, 3, 4, 5],
} as unknown as EventData
assert.equal(formatEventDatesSummary(eventWeekdays), 'Thứ hai – Thứ sáu hàng tuần')


