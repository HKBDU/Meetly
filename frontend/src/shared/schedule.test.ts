import assert from 'node:assert/strict'
import { cellsToSlots, slotsToCells } from './schedule.ts'
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
